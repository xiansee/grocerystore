import express from "express";
import { validateRequest, getGroceryItems, createOrder, appendOrderToUser, cancelOrder } from "../utils/api-helpers/order.js";
import { createError, processAndSendError, processAndSendResponse } from "../utils/api-helpers/response.js";
import { findDocuments } from "../utils/database-helpers/crud.js";
import { userIsAdmin } from "../utils/api-helpers/user.js";

function initRouter(app) {
  const router = express.Router();
  const Order = app.locals.databaseModels["order"];
  const Grocery = app.locals.databaseModels["grocery"];

  router.post("/order", async (req, res) => {
    try {
      if (!req.isAuthenticated()) throw createError("Unauthorized", "User login required.");
      validateRequest(req.body);
      const userId = req.user._id;
      const groceryIdList = req.body.order;
      const groceryItems = await getGroceryItems(Grocery, groceryIdList);

      const newOrder = await createOrder(Order, groceryItems, userId);
      appendOrderToUser(req.user, newOrder._id);

      processAndSendResponse(res, 200, {
        data: newOrder,
      });
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  router.get("/order/:_id", async (req, res) => {
    try {
      const orderId = req.params._id;
      const [order] = await findDocuments(Order, { _id: orderId }, 1);

      if (!order) throw createError("NotFound", "No order found.");
      const groceryItems = await getGroceryItems(Grocery, order.groceryIds);

      processAndSendResponse(res, 200, {
        data: { order: order, groceryItems: groceryItems },
      });
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  router.delete("/order/:_id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) throw createError("Unauthorized", "Administrator authentication required to perform this action.");
      if (!userIsAdmin(req.user)) throw createError("Forbidden", "Only user with Administrator rights can perform this action.");

      const orderId = req.params._id;
      await cancelOrder(Order, orderId, Grocery);

      processAndSendResponse(res, 200, {
        message: `Order ${orderId} has been successfully cancelled.`,
      });
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  return router;
}

export default initRouter;
