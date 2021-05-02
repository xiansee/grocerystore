import * as userHelpers from "./user.js";
import * as crudHelpers from "../database-helpers/crud.js";
import * as authenticationHelpers from "../middleware-helpers/authentication.js";
import regeneratorRuntime from "regenerator-runtime";

const {
  validateLoginRequest,
  validateRegistrationRequest,
  validateUserId,
  validateUpdateFields,
  userExists,
  userIsAdmin,
  registerUser,
  updateUser,
  deleteUser,
} = userHelpers;

test("validate login request body", () => {
  const firstRequest = {
    email: "hello@email.com",
    password: "passwordString",
  };
  const secondRequest = {
    email: "hello@email.com",
  };
  const thirdRequest = {
    email: "hello@email.com",
    password: { value: "passwordString" },
  };

  expect(() => validateLoginRequest(firstRequest)).not.toThrow();
  expect(() => validateLoginRequest(secondRequest)).toThrow();
  expect(() => validateLoginRequest(thirdRequest)).toThrow();
});

test("validate registration request body", () => {
  const firstRequest = {
    firstName: "Hello",
    email: "hello@email.com",
    password: "passwordString",
  };
  const secondRequest = {
    email: "hello@email.com",
  };
  const thirdRequest = {
    email: "hello@email.com",
    password: { value: "passwordString" },
  };

  expect(() => validateRegistrationRequest(firstRequest)).not.toThrow();
  expect(() => validateRegistrationRequest(secondRequest)).toThrow();
  expect(() => validateRegistrationRequest(thirdRequest)).toThrow();
});

test("validate user _id", async () => {
  const firstUserId = "dummyId";
  const mockReturnUser = { _id: "dummyId" };
  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([mockReturnUser]);
  expect(await validateUserId("UserModel", firstUserId)).toEqual(mockReturnUser);

  const secondUserId = 123;
  expect(validateUserId("UserModel", secondUserId)).rejects.toThrow();

  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([]);
  expect(validateUserId("UserModel", firstUserId)).rejects.toThrow();
});

test("validate update fields", async () => {
  const mockFilteredQuery = { _id: "dummyId" };
  jest.spyOn(crudHelpers, "processQuery").mockReturnValue(mockFilteredQuery);
  expect(await validateUpdateFields("Model", "updateQuery", "Standard")).toEqual(mockFilteredQuery);

  const mockPasswordQuery = { password: "password" };
  const hashPassword = "hashed";
  jest.spyOn(crudHelpers, "processQuery").mockReturnValue(mockPasswordQuery);
  jest.spyOn(authenticationHelpers, "getHashedPassword").mockReturnValue(hashPassword);
  const returnValue = await validateUpdateFields("Model", "updateQuery", "Standard");
  expect(returnValue.password).toEqual(hashPassword);

  const mockTypeQuery = { password: "password" };
  jest.spyOn(crudHelpers, "processQuery").mockReturnValue(mockTypeQuery);
  expect(validateUpdateFields("Model", "updateQuery", "Standard")).rejects.toThrow();
});

test("check if user email is already registered", async () => {
  const mockEmail = "hello@email.com";

  jest.spyOn(crudHelpers, "findDocuments").mockResolvedValue([{ email: mockEmail, firstName: "mockFirstName" }]);
  expect(await userExists(mockEmail)).toEqual(true);

  jest.spyOn(crudHelpers, "findDocuments").mockResolvedValue([]);
  expect(await userExists(mockEmail)).toEqual(false);
});

test("check if user is admin", () => {
  const mockStandardUser = { type: "Standard" };
  const mockAdminUser = { type: "Administrator" };

  expect(userIsAdmin(mockStandardUser)).toEqual(false);
  expect(userIsAdmin(mockAdminUser)).toEqual(true);
});

test("register user", async () => {
  const mockModel = "Mock Model";
  const mockNewDocument = "Mock New Document";
  const registration = {
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@gmail.com",
    password: "passwordString",
  };

  jest.spyOn(authenticationHelpers, "getHashedPassword").mockReturnValue("hashed password");
  const createDocument = jest.spyOn(crudHelpers, "createDocument").mockReturnValue(mockNewDocument);
  const saveDocument = jest.spyOn(crudHelpers, "saveDocument").mockImplementation((doc) => doc);

  expect(await registerUser(mockModel, registration)).toEqual(mockNewDocument);
  expect(createDocument).toHaveBeenCalledWith(mockModel, registration);
  expect(saveDocument).toHaveBeenCalledWith(mockNewDocument);
});

test("update user", async () => {
  const updateDocument = jest.spyOn(crudHelpers, "updateDocument").mockReturnValue(null);
  const findDocuments = jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([]);

  await updateUser("User", "userId", {});
  expect(updateDocument).toHaveBeenCalled();
  expect(findDocuments).toHaveBeenCalled();
});

test("delete user", async () => {
  const deleteDocument = jest.spyOn(crudHelpers, "deleteDocument").mockReturnValue(null);

  await deleteUser("User", "userId");
  expect(deleteDocument).toHaveBeenCalled();
});
