import express from "express";
import { config } from "dotenv";
config();
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import ApiRouter from "./routes/api.routes.js";
import EmailRouter from "./routes/api.email.routes.js";
import connectDB from "./connections/mongodb.connection.js";
import cookieParser from "cookie-parser";
import allowedOrigins from "./config/allowOrigin.config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const url =
  process.env.ENVIRONMENT === "local"
    ? `http://localhost:${port}`
    : process.env.HOST_URL;

app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// const frontendPath = path.join(__dirname, "./dist"); // safer: go up 1 level
// app.use(express.static(frontendPath));

app.use("/api/v1/", ApiRouter);
app.use("/api/v1/send/email/", EmailRouter);
// app.get("/*", (req, res) => {
//   res.sendFile(path.join(frontendPath, "index.html"));
// });

app.use((err, req, res, next) => {
  console.log("Error ==> ", err.message);
  return res.status(404).json({
    success: false,
    message: err.message,
  });
});

app.listen(port, () => {
  connectDB();
  console.log(`server started at ${url}`);
});

export default app;
