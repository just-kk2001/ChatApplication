import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import chalk from "chalk";

dotenv.config(); // ✅ Load environment variables early
console.log(chalk.blue("📢 Starting server.js..."));

console.log(chalk.cyan("✅ Environment variables loaded"));

const app = express();
app.use(express.json());
app.use(cors());

console.log(chalk.yellow("✅ Middleware applied"));

try {
  await connectDB();
  console.log(chalk.green("✅ MongoDB connected"));
} catch (error) {
  console.error(chalk.red("❌ MongoDB connection failed:", error.message));
  process.exit(1);
}

app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("uploads"));
app.use("/api/posts", postRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(chalk.magenta(`🚀 Server running on port ${PORT}`))
);
