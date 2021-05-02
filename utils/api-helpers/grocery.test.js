import * as groceryHelpers from "./grocery.js";
import * as crudHelpers from "../database-helpers/crud.js";
import regeneratorRuntime from "regenerator-runtime";

const { validateQuery, processLimit, processQuery, executeQuery, getCategoryId, addGroceryToCategory, createGrocery, updateGrocery } = groceryHelpers;

test("validate api query", () => {
  const firstQuery = {
    category: "Bread and Bakery",
  };
  const secondQuery = {
    name: "Milk",
  };
  const thirdQuery = {};
  const fourthQuery = {
    dummyField: "dummyValue",
  };

  expect(validateQuery(firstQuery)).toEqual(firstQuery);
  expect(validateQuery(secondQuery)).toEqual(secondQuery);
  expect(validateQuery(thirdQuery)).toEqual({});
  expect(() => validateQuery(fourthQuery)).toThrow();
});

test("return limit of either null or integer", () => {
  expect(processLimit({ limit: "1" })).toEqual({ limit: 1 });
  expect(processLimit({ limit: undefined })).toEqual({ limit: null });
  expect(processLimit({ limit: 2 })).toEqual({ limit: 2 });
});

test("process query", () => {
  const firstQuery = {
    category: "category",
    dummyField: "dummyField",
  };
  const secondQuery = {
    name: "name",
    _id: "_id",
    dummyField: "dummyField",
  };
  const thirdQuery = {
    category: "category",
    name: "name",
    dummyField: "dummyField",
  };

  expect(processQuery(firstQuery)).toEqual({ category: "category" });
  expect(processQuery(secondQuery)).toEqual({ name: "name", _id: "_id" });
  expect(processQuery(thirdQuery)).toEqual({ category: "category", name: "name" });
});

test("query database for groceries", async () => {
  const query = {
    category: "category",
    limit: 5,
  };
  const mockResolve = "found documents";
  const findDocuments = jest.spyOn(crudHelpers, "findDocuments").mockReturnValue(new Promise((resolve) => resolve(mockResolve)));

  expect(await executeQuery("model", query)).toEqual(mockResolve);
  expect(findDocuments).toHaveBeenCalledWith("model", { category: "category" }, query.limit);
});

test("get category id", async () => {
  const dummyId = "dummyId";
  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([{ _id: dummyId }]);
  expect(await getCategoryId("CategoryModel", "categoryName")).toEqual(dummyId);

  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([]);
  expect(async () => await getCategoryId("CategoryModel", "categoryName")).rejects.toThrow();
});

test("add grocery to category", async () => {
  const appendDocument = jest.spyOn(crudHelpers, "appendDocument").mockReturnValue(null);
  await addGroceryToCategory({ _id: "dummyId" }, "categoryId", "categoryModel");
  expect(appendDocument).toHaveBeenCalled();
});

test("create grocery", async () => {
  const mockNewItem = { name: "dummyItem" };
  const mockNewDocument = { id: "dummyId" };

  jest.spyOn(crudHelpers, "createDocument").mockReturnValue(mockNewDocument);
  const saveDocument = jest.spyOn(crudHelpers, "saveDocument").mockReturnValue(null);
  jest.spyOn(groceryHelpers, "getCategoryId").mockReturnValue("dummyId");
  const addGroceryToCategory = jest.spyOn(groceryHelpers, "addGroceryToCategory").mockReturnValue(null);

  expect(await createGrocery("GroceryModel", mockNewItem, "CategoryModel")).toEqual(mockNewDocument);
  expect(saveDocument).toHaveBeenCalledWith(mockNewDocument);
  expect(addGroceryToCategory).toHaveBeenCalled();

  const mockEmptyItem = {};
  expect(async () => await createGrocery("GroceryModel", mockEmptyItem, "CategoryModel")).rejects.toThrow();
});

test("updateGrocery", async () => {
  const mockExistingGroceryItem = { _id: "dummyId" };
  const mockUpdate = { name: "dummyName" };
  const expectedUpdatedItem = { ...mockExistingGroceryItem, ...mockUpdate };

  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([mockExistingGroceryItem]);
  const saveDocument = jest.spyOn(crudHelpers, "saveDocument").mockReturnValue(null);

  expect(await updateGrocery("groceryModel", "groceryId", mockUpdate)).toEqual(expectedUpdatedItem);
  expect(saveDocument).toHaveBeenCalled();

  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([]);
  expect(async () => await updateGrocery("groceryModel", "groceryId", mockUpdate)).rejects.toThrow();
});
