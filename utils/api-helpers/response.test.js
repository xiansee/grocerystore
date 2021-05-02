import * as responseHelpers from "./response.js";

const { createError, processError, getResponse, processAndSendError, processAndSendResponse, initJsonSyntaxErrorHandler } = responseHelpers;

class resMockClass {
  status() {
    return this;
  }

  send() {
    return this;
  }
}

class appMockClass {
  constructor(mockRes) {
    this.mockRes = mockRes;
  }

  use(cb) {
    const err = new SyntaxError();
    err.status = 400;
    err.body = "dummyText";

    cb(err, "req", this.mockRes, this.next);
  }

  next() {
    return this;
  }

  send() {
    return this;
  }
}

const mockRes = new resMockClass();
const mockApp = new appMockClass(mockRes);

test("create an error object with name and message", () => {
  const name = "DummyError";
  const message = "DummyMessage";

  const error = createError(name, message);
  expect(error).toBeInstanceOf(Error);
  expect(error.name).toEqual(name);
  expect(error.message).toEqual(message);
});

test("process and return error object", () => {
  const queryError = new Error("Query error message");
  queryError.name = "QueryError";

  expect(processError(queryError, 400)).toEqual({ title: "QueryError", message: "Query error message" });
});

test("get response object", () => {
  const statusCode = 200;
  const message = "dummyMessage";
  const data = "dummyData";

  const responseObj = getResponse(statusCode, { message: message, data: data });
  expect(responseObj.statusCode).toEqual(statusCode);
  expect(responseObj.message).toEqual(message);
  expect(responseObj.data).toEqual(data);
});

test("process and send error", () => {
  const err = new Error();
  err.name = "ValidationError";

  const mockResponse = { status: "Bad Request", statusCode: 400, error: "dummyError" };

  jest.spyOn(responseHelpers, "processError").mockReturnValue({});
  const getResponse = jest.spyOn(responseHelpers, "getResponse").mockReturnValue(mockResponse);
  const resSend = jest.spyOn(mockRes, "send");

  processAndSendError(mockRes, err);
  expect(getResponse).toHaveBeenCalled();
  expect(resSend).toHaveBeenCalledWith(mockResponse);
});

test("process and send response", () => {
  const mockResponse = { status: "OK", statusCode: 200, data: "dummyData" };

  jest.spyOn(responseHelpers, "processError").mockReturnValue({});
  const getResponse = jest.spyOn(responseHelpers, "getResponse").mockReturnValue(mockResponse);
  const resSend = jest.spyOn(mockRes, "send");

  processAndSendResponse(mockRes, 200, {});
  expect(getResponse).toHaveBeenCalled();
  expect(resSend).toHaveBeenCalledWith(mockResponse);
});

test("initialize handler for json SyntaxError", () => {
  const dummyError = new Error();
  jest.spyOn(responseHelpers, "createError").mockReturnValue(dummyError);
  const processAndSendError = jest.spyOn(responseHelpers, "processAndSendError").mockReturnValue(null);
  const next = jest.spyOn(mockApp, "next");

  initJsonSyntaxErrorHandler(mockApp);
  expect(processAndSendError).toHaveBeenCalledWith(mockRes, dummyError);
  expect(next).not.toHaveBeenCalled();
});
