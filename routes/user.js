import express from "express";
import {
  validateLoginRequest,
  validateRegistrationRequest,
  validateUserId,
  validateUpdateFields,
  userExists,
  userIsAdmin,
  registerUser,
  updateUser,
  deleteUser,
} from "../utils/api-helpers/user.js";
import { createError, processAndSendError, processAndSendResponse } from "../utils/api-helpers/response.js";

function initRouter(app) {
  const router = express.Router();
  const User = app.locals.databaseModels["user"];
  const passport = app.locals.passport;

  router.post("/user/register", async (req, res) => {
    try {
      if (req.isAuthenticated()) throw createError("Conflict", `Email ${req.user.email} is currently logged in. Please log out to proceed.`);

      validateRegistrationRequest(req.body);

      const registration = req.body;
      if (await userExists(User, registration.email)) throw createError("Conflict", `Email ${registration.email} is already registered.`);

      await registerUser(User, registration);
      res.redirect(307, "/user/login");
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  router.post("/user/login", passport.authenticate("local"), (req, res) => {
    try {
      validateLoginRequest(req.body);

      if (!req.isAuthenticated()) throw createError("Unauthorized", "Incorrect login credentials.");

      processAndSendResponse(res, 200, {
        message: "User successfully logged in.",
        data: req.user,
      });
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  router.get("/user/logout", (req, res) => {
    try {
      if (!req.isAuthenticated()) throw createError("InvalidRequest", "No user was logged in.");

      const email = req.user.email;
      req.logout();

      processAndSendResponse(res, 200, {
        message: `User ${email} has been logged out.`,
      });
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  router.get("/user/:_id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) throw createError("Unauthorized", "User login required.");

      const userId = req.params._id;
      const user = await validateUserId(User, userId);
      if (!userIsAdmin(req.user) && userId != req.user._id) throw createError("Forbidden", "Only an administrator or owner can view user data.");

      processAndSendResponse(res, 200, {
        data: user,
      });
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  router.put("/user/:_id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) throw createError("Unauthorized", "User login required.");

      const userId = req.params._id;
      await validateUserId(User, userId);
      if (!userIsAdmin(req.user) && userId != req.user._id) throw createError("Forbidden", "Only an administrator or owner can update the user.");

      const authority = req.user.type;
      const updateQuery = await validateUpdateFields(User, req.body, authority);
      const user = await updateUser(User, userId, updateQuery);

      processAndSendResponse(res, 200, {
        message: "User successfully updated.",
        data: user,
      });
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  router.delete("/user/:_id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) throw createError("Unauthorized", "User login required.");

      const userId = req.params._id;
      const user = await validateUserId(User, userId);
      if (!userIsAdmin(req.user) && userId != req.user._id) throw createError("Forbidden", "Only an administrator or owner can remove the user.");

      await deleteUser(User, userId);
      if (req.user._id == userId) req.logout();

      processAndSendResponse(res, 200, {
        message: `User ${user.email} has been successfully removed.`,
      });
    } catch (err) {
      processAndSendError(res, err);
    }
  });

  return router;
}

export default initRouter;
