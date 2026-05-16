import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";

const execAsync = promisify(exec);
const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// yt-dlp path find karo
async function getYtDlpPath() {
  const paths = [
    "/usr/local/bin/yt-dlp",
    "/usr/bin/yt-dlp",
    path.join(__dirname, "node_modules", ".bin", "yt-dlp"),
    "yt-dlp"
  ];
  for (const p of paths) {
    try {
      await execAsync(`${p} --version`);
      console.log("yt-dlp found at:", p);
      return p;
    } catch (e) {}
  }
  return null;
}

app.post("/download", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: "URL required" });
    }

    const ytDlpPath = await getYtDlpPath();
    
    if (!ytDlpPath) {
      return res.status(500).json({ 
        success: false, 
        error: "yt-dlp not found on server" 
      });
    }

    console.log("Downloading:", url);
    
    // Instagram ke liye cookies bypass + user agent
    const command = `${ytDlpPath} --no-playlist --no-warnings -g --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" "${url.trim()}"`;
    
    const { stdout, stderr } = await execAsync(command, { timeout: 60000 });
    console.log("stdout:", stdout);
    console.log("stderr:", stderr);

    const downloadUrl = stdout.trim().split("\n")[0];

    if (downloadUrl && downloadUrl.startsWith("http")) {
      return res.json({ success: true, downloadUrl });
    }

    return res.status(400).json({ success: false, error: "Could not extract URL" });

  } catch (error) {
    console.error("ERROR:", error.message);
    console.error("STDERR:", error.stderr);
    return res.status(500).json({ 
      success: false, 
      error: error.stderr || error.message 
    });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("✅ Server running on", PORT));
