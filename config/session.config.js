import dotenv from "dotenv";
dotenv.config();

export default {
  name: "sid",
  secret: process.env.SESSION_SECRET,
  saveUninitialized: true,
  resave: false,
  store: "MongoStore", //string "MongoStore" triggers MongoDB session store
  cookie: {
    secure: false,
    httpOnly: false,
    maxAge: 2592000,
    sameSite: "strict",
  },
};
