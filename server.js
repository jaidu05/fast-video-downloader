import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("Fast Video Downloader Backend Running 🚀");
});

// Test POST route
app.post("/download", (req, res) => {
  console.log("POST /download HIT");

  return res.json({
    success: true,
    message: "Backend working perfectly",
    body: req.body
  });
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
