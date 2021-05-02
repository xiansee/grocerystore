import * as thisModule from "./order.js";
import { findDocuments, createDocument, saveDocument } from "../database-helpers/crud.js";
import { createError } from "./response.js";

/**
 *  Validate an API request body.
 *  @param {object} request API Request body.
 *  @throw                  Throws an error if request body has an invalid format.
 */
function validateRequest(request) {
  const error = createError("InputError", "Required format for request body: { 'order': [{'_id': '123a4bc'}, ...] }");

  const { order } = request;
  if (!order) throw error;
  if (!Array.isArray(order)) throw error;

  order.map((item) => {
    if (typeof item !== "object") throw error;

    const { _id } = item;
    if (!_id) throw error;
  });

  return;
}

/**
 *  Query for grocery document.
 *  @param  {object} Grocery   Model to be searched.
 *  @param  {array}  orderList List of objects each with _id property.
 *  @return {array}            List of found grocery documents.
 */
async function getGroceryItems(Grocery, orderList) {
  return await Promise.all(
    orderList.map((item) => {
      const { _id } = item;
      return new Promise(async (resolve, reject) => {
        const [groceryFound] = await findDocuments(Grocery, { _id: _id }, 1);
        if (!groceryFound) {
          const notFoundError = createError("InputError", `Invalid grocery _id: '${_id}'.`);
          reject(notFoundError);
        } else resolve(groceryFound);
      });
    })
  );
}

/**
 *  Tally list of grocery items by _id.
 *  @param  {array}  groceryItems List of grocery documents.
 *  @return {object}              Object with a single _id property containing an object with "count" and "document" properties.
 */
function tallyItems(groceryItems) {
  const itemCount = {};
  groceryItems.map((item) => {
    const itemId = item._id;
    if (!itemCount[itemId]) {
      itemCount[itemId] = {
        count: 1,
        document: item,
      };

      return;
    }
    ++itemCount[itemId].count;
  });
  return itemCount;
}

/**
 *  Verify that sufficient stock is available.
 *  @param  {array}  groceryItems List of grocery documents.
 *  @return {object}              Object with a single _id property containing an object with "count" and "document" properties.
 *  @throw                        Throws error if there is insufficient stock.
 */
function verifyStockAvailability(groceryItems) {
  const itemCount = thisModule.tallyItems(groceryItems);
  Object.keys(itemCount).map((id) => {
    const groceryItem = itemCount[id].document;
    const requiredStock = itemCount[id].count;
    const availableStock = groceryItem.stock;
    if (availableStock < requiredStock)
      throw createError(
        "NotFound",
        `Insufficient stock for item '${groceryItem.name}' (_id: ${groceryItem._id}). Required: ${requiredStock}, available: ${availableStock}.`
      );
  });
  return itemCount;
}

/**
 *  Calculate total cost of a list of grocery items.
 *  @param  {array}  groceryItems List of grocery documents.
 *  @return {number}              Total cost by summing the prices of each grocery in the list.
 */
function calculateTotalCost(groceryItems) {
  const prices = groceryItems.map((item) => item.price.value);
  return prices.reduce((total, currentPrice) => total + currentPrice);
}

//impure functions

/**
 *  Create an order document.
 *  @param  {object} Order        Model to add new order to.
 *  @param  {array}  groceryItems List of grocery documents.
 *  @param  {string} userId       Document _id of the user who placed the order.
 *  @return {object}              Newly saved order document.
 */
async function createOrder(Order, groceryItems, userId) {
  const itemCount = thisModule.verifyStockAvailability(groceryItems);

  const totalCost = thisModule.calculateTotalCost(groceryItems);
  const currency = groceryItems[0].price.currency;

  const newDocument = {
    customerId: userId,
    orderDate: new Date(),
    groceryIds: groceryItems,
    totalCost: { value: totalCost, currency: currency },
    paymentReceived: false,
    status: "Active",
  };
  const newOrder = createDocument(Order, newDocument);

  await saveDocument(newOrder);
  thisModule.updateGroceryStock(itemCount);

  return newOrder;
}

/**
 *  Update stock of a list of grocery documents.
 *  @param {object}  itemCount Object with a single _id property containing an object with "count" and "document" properties.
 *  @param {boolean} restock   Specify if stock should be added or removed.
 */
function updateGroceryStock(itemCount, restock = false) {
  Object.keys(itemCount).map((id) => {
    const groceryItem = itemCount[id].document;
    const stockModification = itemCount[id].count;

    if (restock) groceryItem.stock = groceryItem.stock + stockModification;
    else groceryItem.stock = groceryItem.stock - stockModification;
    saveDocument(groceryItem);
  });
  return;
}

/**
 *  Append an order id to a user document.
 *  @param {object} user    Document to be appended to.
 *  @param {string} orderId Document _id of the order to append.
 */
function appendOrderToUser(user, orderId) {
  user.orders.push({ _id: orderId });
  saveDocument(user);
  return;
}

/**
 *  Status an order document's status to "Cancelled".
 *  @param {object} Order   Model containing the order.
 *  @param {string} orderId Document _id of the order to be cancelled.
 *  @param {object} Grocery Model containing grocery documents for stock to be updated.
 */
async function cancelOrder(Order, orderId, Grocery) {
  const [order] = await findDocuments(Order, { _id: orderId }, 1);
  if (!order) throw createError("NotFound", "No order found.");
  if (order.status === "Cancelled") throw createError("Conflict", "Order had already been cancelled.");

  order.status = "Cancelled";
  await saveDocument(order);

  thisModule.restockCancelledOrder(order, Grocery);
  return;
}

/**
 *  Restock grocery for cancelled order.
 *  @param  {object} order   Cancelled order document.
 *  @param  {object} Grocery Model containing grocery documents for stock to be updated.
 */
function restockCancelledOrder(order, Grocery) {
  const groceryIds = order.groceryIds;
  const itemCount = thisModule.tallyItems(groceryIds);
  const restock = true;
  Object.keys(itemCount).map(async (id) => {
    const [document] = await findDocuments(Grocery, { _id: id }, 1);
    itemCount[id].document = document;
    thisModule.updateGroceryStock(itemCount, restock);
  });
  return;
}

export {
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
};
