import * as crudHelpers from "./crud.js";
import regeneratorRuntime from "regenerator-runtime";

const {
  createDocument,
  saveDocument,
  findDocuments,
  getUserPassword,
  processQuery,
  processValidationError,
  updateDocument,
  appendDocument,
  deleteDocument,
} = crudHelpers;

test("create document", () => {
  class MockUserModel {
    constructor(documentObj) {
      this.documentObj = documentObj;
    }
  }
  const document = {
    firstName: "Jane",
    lastName: "Doe",
  };

  const testDocument = createDocument(MockUserModel, document);
  expect(testDocument).toBeInstanceOf(MockUserModel);
  expect(testDocument.documentObj).toEqual(document);
});

test("saves document", () => {
  class MockDocument {
    save() {
      return;
    }
  }
  const testDocument = new MockDocument();
  const save = jest.spyOn(testDocument, "save");

  saveDocument(testDocument);
  expect(save).toHaveBeenCalled();

  jest.spyOn(testDocument, "save").mockImplementation(() => {
    throw new Error();
  });
  expect(saveDocument(testDocument)).rejects.toThrow();
});

test("find documents", async function () {
  const testReturn = "found documents";
  class MockLimit {
    limit(limit) {
      return;
    }
  }
  const mockLimitClass = new MockLimit();
  class MockModel {
    find(query, callback) {
      callback(null, testReturn);
      return mockLimitClass;
    }
  }

  const testModel = new MockModel();
  const dummyQuery = { dummyField: "dummyValue" };
  const dummyLimit = 5;
  const mockFind = jest.spyOn(testModel, "find");
  const mockLimitFn = jest.spyOn(mockLimitClass, "limit");

  expect(await findDocuments(testModel, dummyQuery, dummyLimit)).toEqual(testReturn);
  expect(mockFind).toHaveBeenCalledWith(dummyQuery, expect.any(Function));
  expect(mockLimitFn).toHaveBeenCalledWith(dummyLimit);

  testModel.find = (query, callback) => {
    callback(null, null);
  };
  expect(await findDocuments(testModel, dummyQuery, dummyLimit)).toEqual([]);
});

test("get user's hashed password", async () => {
  class mockModel {
    findOne(query) {
      return this;
    }

    select(field) {
      return this;
    }

    exec(cb) {
      cb(null, { password: "hashedPassword" });
    }
  }
  const User = new mockModel();
  expect(await getUserPassword(User, "dummyEmail")).toEqual("hashedPassword");

  User.exec = (cb) => {
    cb("error", {});
  };
  expect(getUserPassword(User, "dummyEmail")).rejects.toThrow();
});

test("validate and filter a query", () => {
  const mockModel = {
    schema: {
      paths: {
        _id: "dummyValue",
        field1: "dummyValue",
      },
    },
  };
  const firstMockQuery = {
    field1: "dummyValue",
  };
  const secondMockQuery = {
    _id: "dummyValue",
  };
  const thirdMockQuery = {
    field2: "dummyValue",
  };

  expect(processQuery(mockModel, firstMockQuery)).toEqual(firstMockQuery);
  expect(() => processQuery(mockModel, secondMockQuery)).toThrow();
  expect(() => processQuery(mockModel, thirdMockQuery)).toThrow();
});

test("process validation error", () => {
  const mockErr = {
    errors: {
      _id: {
        name: "ValidationError",
      },
    },
  };
  let returnedValue = null;

  returnedValue = processValidationError(mockErr);
  expect(returnedValue).toBeInstanceOf(Error);

  mockErr.errors._id.name = "ValidatorError";
  returnedValue = processValidationError(mockErr);
  expect(returnedValue).toBeInstanceOf(Error);

  mockErr.errors._id.name = "CastError";
  returnedValue = processValidationError(mockErr);
  expect(returnedValue).toBeInstanceOf(Error);

  mockErr.errors._id.name = "OtherError";
  returnedValue = processValidationError(mockErr);
  expect(returnedValue).toEqual(mockErr);
});

test("updates and saves document", async function () {
  class MockDocument {
    constructor(obj) {
      this[Object.keys(obj).shift()] = Object.values(obj).shift();
    }

    save() {
      return;
    }
  }

  const testDocument = new MockDocument({ dummyField: "dummyValue" });
  const mockUpdate = { dummyField: "newValue" };
  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([testDocument]);
  const save = jest.spyOn(testDocument, "save");

  const returnedDocument = await updateDocument("any model", "any query", mockUpdate);
  expect(returnedDocument["dummyField"]).toEqual(mockUpdate["dummyField"]);
  expect(save).toHaveBeenCalled();
});

test("append documents", async function () {
  class MockDocument {
    constructor(obj) {
      this[Object.keys(obj).shift()] = Object.values(obj).shift();
    }

    save() {
      return;
    }
  }

  const testDocument = new MockDocument({ dummyField: [{ anotherDummyField: "firstValue" }] });
  const mockAppend = { dummyField: { anotherDummyField: "secondValue" } };
  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([testDocument]);
  const save = jest.spyOn(testDocument, "save");

  const expectedValue = testDocument.dummyField;
  expectedValue.push(mockAppend.dummyField);

  const returnedDocument = await appendDocument("any model", "any query", mockAppend);
  expect(returnedDocument.dummyField).toEqual(expectedValue);
  expect(save).toHaveBeenCalled();
});

test("delete document", async function () {
  class MockModel {
    deleteOne(query, callback) {
      callback(null);
      return;
    }
  }

  const testModel = new MockModel();
  const deleteOne = jest.spyOn(testModel, "deleteOne");

  const mockQuery = { dummyField: "dummyValue" };
  deleteDocument(testModel, mockQuery);
  expect(deleteOne).toHaveBeenCalledWith(mockQuery, expect.any(Function));

  testModel.deleteOne = (query, callback) => {
    callback("Error");
  };
  deleteDocument(testModel, mockQuery);
  expect(deleteDocument(testModel, mockQuery)).rejects.toThrow();
});
