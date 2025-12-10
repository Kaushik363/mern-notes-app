// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const authRoute = require("./routes/authRoute");
const noteRoutes = require("./routes/notesRoutes"); // make sure file name matches

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });

// Health check route
app.get("/", (req, res) => {
  res.send("Notes API is running");
});

// Auth routes
app.use("/api/auth", authRoute);

// Notes routes
app.use("/api/notes", noteRoutes);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server started on port ${PORT}`);
});
