export class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export function notFound(message) {
  return new ApiError(404, 'RESOURCE_NOT_FOUND', message);
}

export function forbidden(message) {
  return new ApiError(403, 'FORBIDDEN', message);
}

export function unauthorized(message) {
  return new ApiError(401, 'UNAUTHORIZED', message);
}

export function validationError(message) {
  return new ApiError(422, 'VALIDATION_ERROR', message);
}
