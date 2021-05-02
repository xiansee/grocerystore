import express from "express";
import { validateQuery, executeQuery, createGrocery, updateGrocery } from "../utils/api-helpers/grocery.js";
import { createError, processAndSendError, processAndSendResponse } from "../utils/api-helpers/response.js";
import { userIsAdmin } from "../utils/api-helpers/user.js";

function initRouter(app) {
  const router = express.Router();
  const Grocery = app.locals.databaseModels["grocery"];
  const Category = app.locals.databaseModels["category"];

  router.get("/grocery", async (req, res) => {
    try {
      const validatedQuery = validateQuery(req.query);
      const groceries = await executeQuery(Grocery, validatedQuery);

      if (groceries.length === 0) throw createError("NotFound", "No groceries found.");

      processAndSendResponse(res, 200, {
        data: groceries,
      });
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  router.post("/grocery", async (req, res) => {
    try {
      if (!req.isAuthenticated()) throw createError("Unauthorized", "Administrator authentication required to perform this action.");
      if (!userIsAdmin(req.user)) throw createError("Forbidden", "Only user with Administrator rights can perform this action.");

      const newGroceryItem = req.body;
      const createdGrocery = await createGrocery(Grocery, newGroceryItem, Category);

      processAndSendResponse(res, 200, {
        message: "Grocery item successfully created.",
        data: createdGrocery,
      });
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  router.put("/grocery/:_id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) throw createError("Unauthorized", "Administrator authentication required to perform this action.");
      if (!userIsAdmin(req.user)) throw createError("Forbidden", "Only user with Administrator rights can perform this action.");

      const groceryId = req.params._id;
      const update = req.body;
      if (Object.keys(update).length === 0) throw createError("InputError", "No fields provided within request body.");
      const newGrocery = await updateGrocery(Grocery, groceryId, update);

      processAndSendResponse(res, 200, {
        data: newGrocery,
      });
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  return router;
}

export default initRouter;
