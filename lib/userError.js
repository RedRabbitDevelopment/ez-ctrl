
export default class UserError extends Error {
  constructor(message, status = 400, errors) {
    super(message);
    this.message = message;
    this.status = status;
    this.errors = errors;
  }
};

export class UnauthorizedError extends UserError {
  constructor(errors) {
    super('Unauthorized', 401, errors);
  }
};
export class NotFoundError extends UserError {
  constructor(errors) {
    super('NotFound', 404, errors);
  }
};

export class ServerError extends UserError {
  constructor(errors) {
    super('ServerError', 500, errors);
  }
};

export class ValidationError extends UserError {
  constructor(errors) {
    super('Validation', 400, errors);
  }
};
