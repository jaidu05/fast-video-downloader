import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import YTDlpWrap from "yt-dlp-wrap";

const app = express();
app.use(cors());
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// yt-dlp-wrap setup — binary auto download
const ytDlpWrap = new YTDlpWrap();

// Server start hone pe yt-dlp binary download karo
async function setupYtDlp() {
  try {
    console.log("Downloading yt-dlp binary...");
    await YTDlpWrap.downloadFromGithub();
    console.log("✅ yt-dlp ready!");
  } catch (err) {
    console.error("yt-dlp setup failed:", err.message);
  }
}

app.post("/download", async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ success: false, error: "URL required" });
    }

    console.log("Fetching URL:", url);

    const output = await ytDlpWrap.execPromise([
      url.trim(),
      "--no-playlist",
      "--get-url",
      "--user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    ]);

    const downloadUrl = output.trim().split("\n")[0];

    if (downloadUrl && downloadUrl.startsWith("http")) {
      return res.json({ success: true, downloadUrl });
    }

    return res.status(400).json({ success: false, error: "Could not extract URL" });

  } catch (error) {
    console.error("ERROR:", error.message);
    return res.status(500).json({
      success: false,
      error: "Download failed: " + error.message
    });
  }
});

app.get("/health", (req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
  console.log("✅ Server running on", PORT);
  await setupYtDlp();
});
