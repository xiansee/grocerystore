import express from "express";
import { validateRequest, getGroceryItems } from "../utils/api-helpers/saved-cart.js";
import { createError, processAndSendError, processAndSendResponse } from "../utils/api-helpers/response.js";

function initRouter(app) {
  const router = express.Router();
  const Grocery = app.locals.databaseModels["grocery"];

  router.get("/saved-cart", async (req, res) => {
    try {
      const savedCart = req.session.savedCart;

      if (!savedCart) throw createError("NotFound", "No saved cart found.");

      const groceryItems = await getGroceryItems(Grocery, savedCart);
      processAndSendResponse(res, 200, {
        data: groceryItems,
      });
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  router.post("/saved-cart", async (req, res) => {
    try {
      validateRequest(req.body);
      const cart = req.body.cart;

      //Throws error if cart containins invalid _id's
      await getGroceryItems(Grocery, cart);

      req.session.savedCart = cart;

      processAndSendResponse(res, 200, {
        message: "Cart saved to session.",
      });
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  return router;
}

export default initRouter;
