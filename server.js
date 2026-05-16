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
        error: "URL required"
      });
    }

    const response = await fetch("https://api.cobalt.tools/api/json", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        url: url
      })
    });

    const data = await response.json();

    console.log("API RESPONSE:", data);

    // direct success
    if (data.url) {
      return res.json({
        success: true,
        downloadUrl: data.url
      });
    }

    // picker response
    if (data.picker && data.picker.length > 0) {
      return res.json({
        success: true,
        downloadUrl: data.picker[0].url
      });
    }

    // API returned error
    return res.status(400).json({
      success: false,
      error: data.error || "Could not fetch media"
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health route
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

// Start server
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("✅ Server running on port", PORT);
});
