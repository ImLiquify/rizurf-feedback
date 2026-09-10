# PulseFeedback service

This service exposes a Rizurf-compatible API and serves the PulseFeedback microapp.

## Configure

Copy the variable names in `.env.example` into the local environment. `SERVICE_ID`,
`GATEWAY_URL`, and `PUBLIC_URL` must match the values registered with the gateway.
Set `SESSION_SECRET` to a long random value; it signs the microapp's 15-minute,
HTTP-only session cookie and must not be committed.

## Run

Run `npm run build`, then `npm run dev:api`. The server starts at `PORT` (3001 by
default) and serves the UI from that same base URL. The gateway-facing documents are:

- `GET /health`
- `GET /openapi.json`

All application API routes require a gateway-signed access token and use scopes declared
in the OpenAPI document. Visiting `/` starts the gateway authorization-code flow; this
service does not have its own login or sign-out endpoint.
