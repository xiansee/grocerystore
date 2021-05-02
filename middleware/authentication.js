import passport from "passport";
import LocalStrategy from "passport-local";
import authenticationConfig from "../config/authentication.config.js";
import { findDocuments, getUserPassword } from "../utils/database-helpers/crud.js";
import { verifyPassword } from "../utils/middleware-helpers/authentication.js";

function initAuthentication(app) {
  const { localStrategyOptions } = authenticationConfig;
  const User = app.locals.databaseModels["user"];

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user, done) => {
    done(null, user._id);
  });

  passport.deserializeUser(async (id, done) => {
    const [user] = await findDocuments(User, { _id: id }, 1);
    if (user) done(null, user);
  });

  passport.use(
    new LocalStrategy(localStrategyOptions, async (email, password, done) => {
      const userPassword = await getUserPassword(User, email);
      if (!userPassword) return done(null, false);

      const passwordMatched = await verifyPassword(password, userPassword);
      if (!passwordMatched) return done(null, false);

      const [user] = await findDocuments(User, { email: email }, 1);
      return done(null, user);
    })
  );

  return passport;
}

export { initAuthentication };
