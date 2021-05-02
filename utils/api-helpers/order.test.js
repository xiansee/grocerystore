import * as orderHelpers from "./order.js";
import * as crudHelpers from "../database-helpers/crud.js";
import regeneratorRuntime from "regenerator-runtime";

const {
  validateRequest,
  getGroceryItems,
  tallyItems,
  verifyStockAvailability,
  calculateTotalCost,
  createOrder,
  updateGroceryStock,
  appendOrderToUser,
  cancelOrder,
  restockCancelledOrder,
} = orderHelpers;

test("validate request body", () => {
  const firstRequest = {
    order: [{ _id: 123 }],
  };
  const secondRequest = {
    order: [{ id: 123 }],
  };
  const thirdRequest = {
    order: [123, 567],
  };
  const fourthRequest = {
    order: 123,
  };
  const fifthRequest = {
    order: [[123], [456]],
  };

  expect(() => validateRequest(firstRequest)).not.toThrow();
  expect(() => validateRequest(secondRequest)).toThrow();
  expect(() => validateRequest(thirdRequest)).toThrow();
  expect(() => validateRequest(fourthRequest)).toThrow();
  expect(() => validateRequest(fifthRequest)).toThrow();
});

test("get grocery items", async () => {
  const mockOrderList = [{ _id: "dummyId" }, { _id: "dummyId" }];
  const mockGroceryItems = [{ name: "dummyName" }, { name: "dummyName" }];

  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue(mockGroceryItems);
  expect(await getGroceryItems("GroceryModel", mockOrderList)).toEqual(mockGroceryItems);

  const mockNoItemsFound = [];
  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue(mockNoItemsFound);
  expect(async () => await getGroceryItems("GroceryModel", mockOrderList)).rejects.toThrow();
});

test("tally items by unique id", () => {
  const firstUniqueItem = { _id: "dummyId1" };
  const secondUniqueItem = { _id: "dummyId2" };
  const mockGroceryItems = [firstUniqueItem, firstUniqueItem, secondUniqueItem];
  const expectedReturn = {
    dummyId1: { count: 2, document: firstUniqueItem },
    dummyId2: { count: 1, document: secondUniqueItem },
  };

  expect(tallyItems(mockGroceryItems)).toEqual(expectedReturn);
});

test("verify stock availability", () => {
  const mockGroceryItem = { _id: "dummyId", stock: 2 };
  const firstMockItemCount = {
    dummyId: { count: 2, document: mockGroceryItem },
  };
  const secondMockItemCount = {
    dummyId: { count: 5, document: mockGroceryItem },
  };

  jest.spyOn(orderHelpers, "tallyItems").mockReturnValue(firstMockItemCount);
  expect(() => verifyStockAvailability([mockGroceryItem])).not.toThrow();

  jest.spyOn(orderHelpers, "tallyItems").mockReturnValue(secondMockItemCount);
  expect(() => verifyStockAvailability([mockGroceryItem])).toThrow();
});

test("calculate total cost of grocery items", () => {
  const mockGroceryItems = [{ price: { value: 3 } }, { price: { value: 2 } }];
  expect(calculateTotalCost(mockGroceryItems)).toEqual(5);
});

test("create order", async () => {
  const mockGroceryItems = [{ price: { value: 3, currency: "CAD" } }, { price: { value: 2, currency: "CAD" } }];
  const mockNewOrder = { _id: "dummyId" };
  jest.spyOn(orderHelpers, "verifyStockAvailability").mockReturnValue(null);
  jest.spyOn(orderHelpers, "calculateTotalCost").mockReturnValue(10);
  jest.spyOn(orderHelpers, "updateGroceryStock").mockReturnValue(null);

  const createDocument = jest.spyOn(crudHelpers, "createDocument").mockReturnValue(mockNewOrder);
  const saveDocument = jest.spyOn(crudHelpers, "saveDocument").mockReturnValue(null);

  expect(await createOrder("orderModel", mockGroceryItems, "userId")).toEqual(mockNewOrder);
  expect(createDocument).toHaveBeenCalled();
  expect(saveDocument).toHaveBeenCalled();
});

test("update grocery stock", () => {
  const saveDocument = jest.spyOn(crudHelpers, "saveDocument").mockReturnValue(null);

  const mockItemCount = {
    dummyId: { count: 2, document: { stock: 5 } },
  };
  const expectedSave = { stock: 3 };
  updateGroceryStock(mockItemCount);
  expect(saveDocument).toHaveBeenCalledWith(expectedSave);

  const mockItemCountForCancellation = {
    dummyId: { count: 2, document: { stock: 5 } },
  };
  const expectedSaveOnCancellation = {
    stock: 7,
  };
  updateGroceryStock(mockItemCountForCancellation, true);
  expect(saveDocument).toHaveBeenCalledWith(expectedSaveOnCancellation);
});

test("update order to user document", () => {
  const mockUser = { orders: [{ _id: "dummyId1" }] };
  const mockNewOrderId = "dummyId2";
  const expectedReturn = { orders: [...mockUser.orders, { _id: mockNewOrderId }] };

  const saveDocument = jest.spyOn(crudHelpers, "saveDocument").mockReturnValue(null);

  appendOrderToUser(mockUser, mockNewOrderId);
  expect(saveDocument).toHaveBeenCalledWith(expectedReturn);
});

test("cancel order", async () => {
  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([{}]);
  const saveDocument = jest.spyOn(crudHelpers, "saveDocument").mockReturnValue(null);
  const restockCancelledOrder = jest.spyOn(orderHelpers, "restockCancelledOrder").mockReturnValue(null);

  const expectedSave = { status: "Cancelled" };

  await cancelOrder("Order", "orderId");
  expect(saveDocument).toHaveBeenCalledWith(expectedSave);
  expect(restockCancelledOrder).toHaveBeenCalled();

  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([]);
  expect(async () => await cancelOrder("Order", "orderId")).rejects.toThrow();

  jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([{ order: "Cancelled" }]);
  expect(async () => await cancelOrder("Order", "orderId")).rejects.toThrow();
});

test("restock cancelled order", () => {
  const mockItemCount = {
    dummyId: { count: 2, document: {} },
  };

  jest.spyOn(orderHelpers, "tallyItems").mockReturnValue(mockItemCount);
  const findDocuments = jest.spyOn(crudHelpers, "findDocuments").mockReturnValue([{}]);
  const updateGroceryStock = jest.spyOn(orderHelpers, "updateGroceryStock").mockReturnValue(null);

  restockCancelledOrder({});
  expect(findDocuments).toHaveBeenCalled();
  expect(updateGroceryStock).toHaveBeenCalled();
});
