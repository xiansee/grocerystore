import { initDatabase } from "../database-helpers/initiation.js";
import { initAuthentication } from "../../middleware/authentication.js";
import { initRouters } from "../../middleware/routers.js";
import { initSession } from "../../middleware/session.js";
import { initJsonSyntaxErrorHandler } from "../api-helpers/response.js";

async function initServer(app) {
  app.locals.databaseModels = await initDatabase();
  //initSession() required before initAuthentication()
  initSession(app);
  app.locals.passport = initAuthentication(app);
  initRouters(app);

  initJsonSyntaxErrorHandler(app);
  return app;
}

export { initServer };
