import express from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import swaggerOptions from "../config/swagger.config.js";

async function initRouter(app) {
  const router = express.Router();
  const openApiSpec = await swaggerJsdoc(swaggerOptions);

  router.use("/api-docs", swaggerUi.serve);
  router.get("/api-docs", swaggerUi.setup(openApiSpec));

  router.get("/", (req, res) => res.redirect(307, "/api-docs"));

  return router;
}

export default initRouter;
