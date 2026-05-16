import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(cors());
app.use(express.json());

// Path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Download route
app.post("/download", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "Video URL is required"
      });
    }

    // Request to cobalt API
    const response = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        url: url
      })
    });

    const data = await response.json();

    // Success
    if (data.url) {
      return res.json({
        success: true,
        downloadUrl: data.url
      });
    }

    // API error
    return res.status(400).json({
      success: false,
      error: data.error || "Failed to fetch video"
    });

  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      error: "Server error"
    });
  }
});

// Health route
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// Port
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
