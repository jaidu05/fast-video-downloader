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

    const response = await fetch("https://api.cobalt.tools/", {
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

    console.log(data);

    // direct stream
    if (
      data.status === "redirect" ||
      data.status === "stream" ||
      data.status === "tunnel"
    ) {
      return res.json({
        success: true,
        downloadUrl: data.url
      });
    }

    // picker mode
    if (data.status === "picker") {
      return res.json({
        success: true,
        downloadUrl: data.picker?.[0]?.url
      });
    }

    // fail
    return res.status(400).json({
      success: false,
      error: data.error?.code || "Could not fetch media"
    });

  } catch (error) {
    console.error(error);

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
