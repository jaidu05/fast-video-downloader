import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

// Home route
app.get("/", (req, res) => {
  res.send("Fast Video Downloader Backend Running 🚀");
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

    // Success response
    if (data.url) {
      return res.json({
        success: true,
        downloadUrl: data.url
      });
    }

    // If API fails
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

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
