import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
// import taskRoutes from "./routes/task.routes.js";

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/user", userRoutes);
// app.use("/api/task", taskRoutes);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

export default app;
