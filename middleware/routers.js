import routesConfig from "../config/routes.config.js";

function initRouters(app) {
  routesConfig.map(async function (route) {
    const routerModule = await import("../" + route.path);
    const routerFn = routerModule.default;
    const router = await routerFn(app);
    app.use(router);
  });
}

export { initRouters };
