import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
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

    // yt-dlp se direct download URL nikalo
    const command = `yt-dlp --no-playlist -g "${url.trim()}"`;
    const { stdout } = await execAsync(command, { timeout: 30000 });

    const downloadUrl = stdout.trim().split("\n")[0];

    if (downloadUrl && downloadUrl.startsWith("http")) {
      return res.json({
        success: true,
        downloadUrl: downloadUrl
      });
    }

    return res.status(400).json({
      success: false,
      error: "Could not fetch media URL"
    });

  } catch (error) {
    console.error("SERVER ERROR:", error.message);
    return res.status(500).json({
      success: false,
      error: "Download failed. Try another URL."
    });
  }
});

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("✅ Server running on", PORT);
});
