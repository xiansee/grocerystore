import * as thisModule from "./response.js";

const statusCodeLookUp = {
  QueryError: 400,
  InputError: 400,
  InvalidRequest: 400,
  ValidationError: 400,
  ValidatorError: 400,
  CastError: 400,
  SyntaxError: 400,
  Unauthorized: 401,
  Forbidden: 403,
  NotFound: 404,
  Conflict: 409,
};

const statusDescription = {
  200: "OK",
  400: "Bad Request.",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found.",
  409: "Conflict",
  500: "Interval Server Error",
};

/**
 *  Create an error object
 *  @param  {string} name     Name of error.
 *  @param  {string} message  Error message.
 *  @return {object}          Error object.
 */
function createError(name, message) {
  const error = new Error(message);
  error.name = name;
  return error;
}

/**
 *  Generate an object containing error name and message.
 *  @param  {object} error      Error object.
 *  @param  {number} statusCode Http status code.
 *  @return {object}            Object with error name and message.
 */
function processError(error, statusCode) {
  return {
    title: error.name,
    message: statusCode === 500 ? "Unexpected server-side error." : error.message,
  };
}

/**
 *  Generate a response for an API request.
 *  @param  {number} statusCode Http status code.
 *  @param  {object} settings   An object containing any of the following keys: [errorObj, message, data]
 *  @return {object}            Response object.
 */
function getResponse(statusCode, settings) {
  const { errorObj, message, data } = settings;
  const response = {};

  statusDescription[statusCode] ? (response["status"] = statusDescription[statusCode]) : null;
  response["statusCode"] = statusCode;
  errorObj ? (response["error"] = errorObj) : null;
  message ? (response["message"] = message) : null;
  data ? (response["data"] = data) : null;

  return response;
}

//impure functions

/**
 *  Process and send an error response.
 *  @param  {object} res Response object of the API request.
 *  @param  {object} err The error object.
 */
function processAndSendError(res, err) {
  const statusCode = statusCodeLookUp[err.name] || 500;
  const errorObj = thisModule.processError(err, statusCode);
  if (statusCode === 500) console.error(err);

  const response = thisModule.getResponse(statusCode, {
    errorObj: errorObj,
  });

  res.status(statusCode).send(response);
  return;
}

/**
 *  Process and send a response for an API request.
 *  @param {object} res        Response object of the API request.
 *  @param {number} statusCode Http status code.
 *  @param {object} settings   An object containing any of the following keys: [errorObj, message, data]
 */
function processAndSendResponse(res, statusCode, settings) {
  const response = thisModule.getResponse(statusCode, settings);
  res.status(statusCode).send(response);
  return;
}

/**
 *  Initialize a custom handler for SyntaxError generated from using express.json()
 *  @param {object} app Express application.
 */
function initJsonSyntaxErrorHandler(app) {
  app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
      const error = thisModule.createError("SyntaxError", err.message);
      thisModule.processAndSendError(res, error);
      return;
    }
    next();
  });
}

export { createError, processError, getResponse, processAndSendError, processAndSendResponse, initJsonSyntaxErrorHandler };
