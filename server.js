const express = require("express");
const cors = require("cors");
const path = require("path");
const { exec } = require("child_process");
const fs = require("fs");
const os = require("os");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/download", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ success: false, error: "URL required" });

  const ytdlp = path.join(__dirname, "yt-dlp");
  const ffmpeg = path.join(__dirname, "ffmpeg");
  const tmpFile = path.join(os.tmpdir(), `video_${Date.now()}.mp4`);
  const trimmedUrl = url.trim();

  const isYouTube = trimmedUrl.includes("youtube.com") || trimmedUrl.includes("youtu.be");
  const isPinterest = trimmedUrl.includes("pinterest.com") || trimmedUrl.includes("pin.it");
  const isInstagram = trimmedUrl.includes("instagram.com");

  let cmd;

  if (isYouTube) {
    // YouTube: sabse reliable method
    cmd = `"${ytdlp}" --no-playlist --ffmpeg-location "${ffmpeg}" -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best" --merge-output-format mp4 -o "${tmpFile}" "${trimmedUrl}" --extractor-args "youtube:player_client=android,web" --no-check-certificate`;
  } else if (isPinterest) {
    cmd = `"${ytdlp}" --no-playlist --ffmpeg-location "${ffmpeg}" -f "best[ext=mp4]/best" --merge-output-format mp4 -o "${tmpFile}" "${trimmedUrl}" --no-check-certificate`;
  } else if (isInstagram) {
    cmd = `"${ytdlp}" --no-playlist --ffmpeg-location "${ffmpeg}" -f "bestvideo+bestaudio/best" --merge-output-format mp4 -o "${tmpFile}" "${trimmedUrl}" --no-check-certificate`;
  } else {
    cmd = `"${ytdlp}" --no-playlist --ffmpeg-location "${ffmpeg}" -f "bestvideo+bestaudio/best" --merge-output-format mp4 -o "${tmpFile}" "${trimmedUrl}" --no-check-certificate`;
  }

  console.log("Platform:", isYouTube ? "YouTube" : isPinterest ? "Pinterest" : isInstagram ? "Instagram" : "Other");
  console.log("Downloading:", trimmedUrl);

  exec(cmd, { timeout: 180000 }, (error, stdout, stderr) => {
    console.log("stdout:", stdout);
    console.log("stderr:", stderr);

    if (error) {
      console.error("ERROR:", error.message);
      if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
      return res.status(500).json({ success: false, error: "Download failed. Try another URL." });
    }

    if (!fs.existsSync(tmpFile)) {
      return res.status(500).json({ success: false, error: "File not created" });
    }

    res.download(tmpFile, "video.mp4", (err) => {
      fs.unlink(tmpFile, () => {});
      if (err) console.error("Send error:", err.message);
    });
  });
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port", PORT));
