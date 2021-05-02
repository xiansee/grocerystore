import dotenv from "dotenv";
dotenv.config();
import express from "express";

import { initServer } from "./utils/server-helpers/server-initiation.js";

const PORT = process.env.PORT || 5000;
const app = express();
app.use(express.json());

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}.`);
});

initServer(app);
