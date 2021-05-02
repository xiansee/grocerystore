import session from "express-session";
import MongoStore from "connect-mongo";

import sessionConfig from "../config/session.config.js";
import databaseConfig from "../config/database.config.js";

function initSession(app) {
  if (sessionConfig.store === "MongoStore") {
    sessionConfig.store = initMongoStore();
  }

  app.use(session(sessionConfig));
}

function initMongoStore() {
  const { baseUri, databaseName } = databaseConfig;
  return MongoStore.create({
    mongoUrl: `${baseUri}/${databaseName}`,
  });
}

export { initSession };
