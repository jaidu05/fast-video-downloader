import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const app = express();

app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));

// Home page
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

    // API request
    const response = await fetch("https://co.wuk.sh/api/json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        url: url.trim()
      })
    });

    const data = await response.json();

    console.log("API RESPONSE:", data);

    // Success
    if (data.url) {
      return res.json({
        success: true,
        downloadUrl: data.url
      });
    }

    // Picker support
    if (data.picker && data.picker.length > 0) {
      return res.json({
        success: true,
        downloadUrl: data.picker[0].url
      });
    }

    // Fail
    return res.status(400).json({
      success: false,
      error: data.error || data.text || "Could not fetch media"
    });

  } catch (error) {
    console.error("SERVER ERROR:", error);

    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok"
  });
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("✅ Server running on", PORT);
});
