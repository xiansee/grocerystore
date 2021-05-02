import * as savedCartHelpers from "./saved-cart.js";
import * as crudHelpers from "../database-helpers/crud.js";
import regeneratorRuntime from "regenerator-runtime";

const { validateRequest, validateIds, getGroceryItems } = savedCartHelpers;

test("validate request body", () => {
  const firstRequest = {
    cart: [{ _id: 123 }],
  };
  const secondRequest = {
    order: [{ _id: 123 }],
  };
  const thirdRequest = {
    cart: [123, 567],
  };
  const fourthRequest = {
    cart: 123,
  };
  const fifthRequest = {
    cart: [[123], [456]],
  };

  expect(() => validateRequest(firstRequest)).not.toThrow();
  expect(() => validateRequest(secondRequest)).toThrow();
  expect(() => validateRequest(thirdRequest)).toThrow();
  expect(() => validateRequest(fourthRequest)).toThrow();
  expect(() => validateRequest(fifthRequest)).toThrow();
});

test("get grocery items", () => {
  const mockCart = [{ _id: "dummyId" }, { _id: "dummyId" }];
  const mockItem = { _id: "dummyId" };

  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([mockItem]);
  expect(getGroceryItems("GroceryModel", mockCart)).resolves.toEqual([mockItem, mockItem]);

  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([]);
  expect(getGroceryItems("GroceryModel", mockCart)).rejects.toThrow();
});
