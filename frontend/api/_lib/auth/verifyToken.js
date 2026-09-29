// MICROAPP_AUTH.md §3 / RIZURF_API_TEMPLATE.md SS-25 — dependency-free,
// proven-working token verification against the gateway's own published
// key. Never trust a header or the route a request arrived on; decide who
// a caller is from a token whose signature this file checks itself.
import { createPublicKey, verify as cryptoVerify } from 'node:crypto';
import { config } from '../config.js';

// Fetched once and kept for the process lifetime — the key only changes on
// a gateway redeploy, which restarts this process too in any real deploy.
let jwksCache = null;

function base64UrlDecode(segment) {
  return Buffer.from(segment, 'base64url');
}

async function getGatewayPublicKey(kid) {
  if (!jwksCache) {
    const response = await fetch(`${config.gatewayUrl}/.well-known/jwks.json`);
    if (!response.ok) throw new Error(`JWKS fetch failed: ${response.status}`);
    jwksCache = await response.json();
  }
  const jwk = jwksCache.keys.find((key) => key.kid === kid);
  if (!jwk) throw new Error(`No key "${kid}" in the gateway's JWKS.`);
  return createPublicKey({ key: jwk, format: 'jwk' });
}

/**
 * Verify a token against the gateway's own published key. Throws on
 * anything wrong — an unverifiable token is not a token, not a token with
 * less information.
 *
 * `expectedUse` is not optional: the gateway signs both a five-minute
 * "identity" assertion (a human signed in) and a scoped "access" token
 * (client_credentials) with the same key, both carrying `aud` = our
 * service id. Checking `token_use` is what keeps one from being replayed
 * where the other is expected.
 */
export async function verifyToken(token, expectedUse) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Malformed token.');
  const [headerB64, payloadB64, sigB64] = parts;

  const header = JSON.parse(base64UrlDecode(headerB64).toString('utf8'));
  if (header.alg !== 'RS256') throw new Error(`Unexpected algorithm "${header.alg}".`);

  const publicKey = await getGatewayPublicKey(header.kid);

  const signingInput = `${headerB64}.${payloadB64}`;
  const ok = cryptoVerify('RSA-SHA256', Buffer.from(signingInput), publicKey, base64UrlDecode(sigB64));
  if (!ok) throw new Error('Signature does not verify.');

  const claims = JSON.parse(base64UrlDecode(payloadB64).toString('utf8'));

  if (claims.token_use !== expectedUse) {
    throw new Error(`Expected a "${expectedUse}" token, got "${claims.token_use ?? 'none'}".`);
  }
  if (typeof claims.exp !== 'number' || claims.exp * 1000 < Date.now()) {
    throw new Error('Token has expired.');
  }
  if (claims.iss !== config.gatewayUrl) {
    throw new Error(`Token issuer "${claims.iss}" is not this app's configured gateway.`);
  }
  // The gateway addresses identity tokens to the app's own origin (PUBLIC_URL);
  // the service id is still accepted. Both name this app and nothing else.
  if (claims.aud !== config.serviceId && claims.aud !== config.publicUrl) {
    throw new Error(`Token audience "${claims.aud}" was not minted for this service.`);
  }

  return claims;
}
