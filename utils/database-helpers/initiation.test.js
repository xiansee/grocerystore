import mongoose from "mongoose";
import * as initiationHelpers from "./initiation.js";
import * as crudHelpers from "./crud.js";
import "regenerator-runtime/runtime.js";
import mockMongooseConfig from "../../config/database.config.js";
import regeneratorRuntime from "regenerator-runtime";

jest.mock("../../config/database.config.js", () => {
  return {
    __esModule: true,
    default: {
      baseUri: "dummyBaseUri",
      databaseName: "dummyDatabaseName",
      addDemoData: true,
      models: [{ modelName: "category" }, { modelName: "user" }],
    },
  };
});

const { connectMongodb, createModel, getDemoData, collectionIsEmpty, linkCategoriesAndGroceries, loadDemoData, initDatabase } = initiationHelpers;

test("call mongoose.connect() to database", () => {
  const dummyBaseUri = mockMongooseConfig.baseUri;
  const dummyDatabaseName = mockMongooseConfig.databaseName;
  const expectedUri = `${dummyBaseUri}/${dummyDatabaseName}`;

  const set = jest.spyOn(mongoose, "set");
  const connect = jest.spyOn(mongoose, "connect");
  set.mockImplementation(() => null);
  connect.mockImplementation(() => null);

  connectMongodb({
    mongoose: mongoose,
    baseUri: dummyBaseUri,
    databaseName: dummyDatabaseName,
  });
  expect(connect).toHaveBeenCalledWith(expectedUri);
});

test("return mongoose model", () => {
  const schemaConfig = {
    firstName: String,
    lastName: String,
  };
  const modelName = "User";

  const Schema = jest.spyOn(mongoose, "Schema");
  const model = jest.spyOn(mongoose, "model");
  Schema.mockImplementation((schemaConfig) => schemaConfig);
  model.mockImplementation((modelName, schema) => null);

  createModel({
    mongoose: mongoose,
    schemaConfig: schemaConfig,
    modelName: modelName,
  });
  expect(Schema).toHaveBeenCalled();
  expect(model).toHaveBeenCalledWith(modelName, schemaConfig);
});

test("reads demo data from filepath", async function () {
  const filepath = "/data/test/";
  const testDemoData = await getDemoData(filepath);

  const categoryData = (await import("../../data/test/category.js")).default;
  const userData = (await import("../../data/test/user.js")).default;
  const groceryData = (await import("../../data/test/grocery.js")).default;

  expect(testDemoData.category).toEqual(categoryData);
  expect(testDemoData.user).toEqual(userData);
  expect(testDemoData.grocery).toEqual(groceryData);
});

test("check if collection is empty", async function () {
  class MockModel {
    findOne(query, callback) {
      callback(null, "found item");
    }
  }

  const testModel = new MockModel();
  expect(await collectionIsEmpty(testModel)).toEqual(false);

  testModel.findOne = (query, callback) => {
    callback(null, null);
  };
  expect(await collectionIsEmpty(testModel)).toEqual(true);

  testModel.findOne = (query, callback) => {
    callback("err");
  };
  expect(collectionIsEmpty(testModel)).rejects.toThrow();
});

test("link category and grocery data", async function () {
  const categoryData = (await import("../../data/test/category.js")).default;
  const groceryData = (await import("../../data/test/grocery.js")).default;

  const findDocuments = jest.spyOn(crudHelpers, "findDocuments").mockImplementation((model) => {
    if (model === "mockCategoryModel") return Promise.resolve(categoryData);
    return Promise.resolve(groceryData);
  });
  const updateDocument = jest.spyOn(crudHelpers, "updateDocument").mockReturnValue(null);
  const appendDocument = jest.spyOn(crudHelpers, "appendDocument").mockReturnValue(null);

  const expectedNumOfCalls = groceryData.length;

  await linkCategoriesAndGroceries("mockGroceryModel", "mockCategoryModel");
  expect(findDocuments).toHaveBeenCalledTimes(2);
  expect(updateDocument).toHaveBeenCalledTimes(expectedNumOfCalls);
  expect(appendDocument).toHaveBeenCalledTimes(expectedNumOfCalls);
});

test("load demo data into database", async function () {
  class MockModel {
    save() {
      return Promise.resolve();
    }
  }

  const demoData = {
    category: (await import("../../data/test/category.js")).default,
    user: (await import("../../data/test/user.js")).default,
  };
  const testModel = new MockModel();
  const databaseModels = {
    category: testModel,
    user: testModel,
  };

  let expectedTotalSaveCalls = 0;
  Object.keys(demoData).map((key) => {
    demoData[key].map(() => expectedTotalSaveCalls++);
  });

  jest.spyOn(initiationHelpers, "getDemoData").mockResolvedValue(demoData);
  jest.spyOn(crudHelpers, "createDocument").mockReturnValue(testModel);
  const save = jest.spyOn(testModel, "save");

  //Test when collection is empty
  jest.spyOn(initiationHelpers, "collectionIsEmpty").mockReturnValue(Promise.resolve(true));
  let output = await loadDemoData(databaseModels, "/data/test/");
  expect(output.length).toEqual(2);
  expect(save).toHaveBeenCalledTimes(expectedTotalSaveCalls);

  //Test when collection is not empty
  jest.spyOn(initiationHelpers, "collectionIsEmpty").mockReturnValue(Promise.resolve(false));
  save.mockClear();
  output = await loadDemoData(databaseModels, "/data/test/");
  expect(output.length).toEqual(2);
  expect(save).toHaveBeenCalledTimes(0);
});

test("initialize database", async function () {
  const connectMongodb = jest.spyOn(initiationHelpers, "connectMongodb").mockReturnValue(null);
  const createModel = jest.spyOn(initiationHelpers, "createModel").mockImplementation((obj) => obj.modelName);
  const loadDemoData = jest.spyOn(initiationHelpers, "loadDemoData").mockReturnValue(null);
  const linkCategoriesAndGroceries = jest.spyOn(initiationHelpers, "linkCategoriesAndGroceries").mockReturnValue(null);

  const output = await initDatabase();
  const expectedOutput = {};
  mockMongooseConfig.models.map((model) => (expectedOutput[model.modelName] = model.modelName));

  expect(connectMongodb).toHaveBeenCalled();
  expect(createModel).toHaveBeenCalled();
  expect(loadDemoData).toHaveBeenCalled();
  expect(linkCategoriesAndGroceries).toHaveBeenCalled();
  expect(output).toEqual(expectedOutput);
});
