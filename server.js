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

  const command = `yt-dlp --no-playlist -g "${url.trim()}"`;

  exec(command, { timeout: 60000 }, (error, stdout, stderr) => {
    if (error) {
      console.error("ERROR:", error.message);
      console.error("STDERR:", stderr);
      return res.status(500).json({ success: false, error: stderr || error.message });
    }

    const downloadUrl = stdout.trim().split("\n")[0];

    if (downloadUrl && downloadUrl.startsWith("http")) {
      return res.json({ success: true, downloadUrl });
    }

    return res.status(400).json({ success: false, error: "Could not extract URL" });
  });
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log("Server running on port", PORT));
