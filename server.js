const express = require("express");
const cors = require("cors");
const path = require("path");
const { exec } = require("child_process");

const app = express();
app.use(cors());
app.use(express.json());

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/download", (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, error: "URL required" });
  }

  const ytdlp = path.join(__dirname, "yt-dlp");
  const ffmpeg = path.join(__dirname, "ffmpeg");

  // Audio+Video merge karke best quality download
  const command = `"${ytdlp}" --no-playlist --ffmpeg-location "${ffmpeg}" -f "bestvideo+bestaudio/best" --merge-output-format mp4 -g "${url.trim()}"`;

  exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
    console.log("stdout:", stdout);
    console.log("stderr:", stderr);

    if (error) {
      console.error("ERROR:", error.message);
      return res.status(500).json({ success: false, error: stderr || error.message });
    }

    const lines = stdout.trim().split("\n").filter(l => l.startsWith("http"));
    const downloadUrl = lines[0];

    if (downloadUrl) {
      return res.json({ success: true, downloadUrl });
    }

    return res.status(400).json({ success: false, error: "Could not extract URL" });
  });
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port", PORT));
