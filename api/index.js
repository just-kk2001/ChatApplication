import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "../config/db.js";
import authRoutes from "../routes/authRoutes.js";
import postRoutes from "../routes/postRoutes.js";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  credentials: true
}));

// Connect to MongoDB
let dbConnected = false;

const ensureDBConnection = async (req, res, next) => {
  if (!dbConnected) {
    try {
      await connectDB();
      dbConnected = true;
      console.log("✅ Database connected successfully");
    } catch (error) {
      console.error("❌ MongoDB connection failed:", error.message);
      return res.status(500).json({ error: "Database connection failed" });
    }
  }
  next();
};

app.use(ensureDBConnection);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Backend is running on Vercel" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error", message: err.message });
});

export default app;
