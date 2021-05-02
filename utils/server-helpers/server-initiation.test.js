import * as serverInitiationHelpers from "./server-initiation.js";

import * as databaseHelpers from "../database-helpers/initiation.js";
import * as authenticationMiddleware from "../../middleware/authentication.js";
import * as routersMiddleware from "../../middleware/routers.js";
import * as sessionMiddleware from "../../middleware/session.js";
import * as responseHandler from "../api-helpers/response.js";

import regeneratorRuntime from "regenerator-runtime";

const { initServer } = serverInitiationHelpers;

test("initialize server", async () => {
  class MockApp {
    constructor(obj) {
      this.locals = obj;
    }
  }

  const mockApp = new MockApp({});
  const mockDatabaseModels = "databaseModels";
  const mockPassport = "passport";
  const mockInitDatabase = jest.spyOn(databaseHelpers, "initDatabase").mockResolvedValue(mockDatabaseModels);
  const mockInitAuthentication = jest.spyOn(authenticationMiddleware, "initAuthentication").mockReturnValue(mockPassport);
  const mockInitRouters = jest.spyOn(routersMiddleware, "initRouters").mockReturnValue(null);
  const mockInitSession = jest.spyOn(sessionMiddleware, "initSession").mockReturnValue(null);
  const mockInitJsonErrorHandler = jest.spyOn(responseHandler, "initJsonSyntaxErrorHandler").mockReturnValue(null);

  const output = await initServer(mockApp);
  expect(output.locals.databaseModels).toEqual(mockDatabaseModels);
  expect(output.locals.passport).toEqual(mockPassport);
  expect(mockInitDatabase).toHaveBeenCalled();
  expect(mockInitAuthentication).toHaveBeenCalledWith(mockApp);
  expect(mockInitRouters).toHaveBeenCalledWith(mockApp);
  expect(mockInitSession).toHaveBeenCalledWith(mockApp);
  expect(mockInitJsonErrorHandler).toHaveBeenCalledWith(mockApp);
});
