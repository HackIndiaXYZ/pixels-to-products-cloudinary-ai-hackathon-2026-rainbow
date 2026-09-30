import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());
app.use(express.json());

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

function calculateWasteScore(result) {
  let score = 0;

  const focus = result.quality_analysis?.focus ?? 1;

  if (focus < 0.4) score += 35;
  else if (focus < 0.6) score += 20;

  if (result.bytes > 5 * 1024 * 1024) score += 20;
  else if (result.bytes > 2 * 1024 * 1024) score += 10;

  return Math.min(score, 100);
}

function recommendation(score) {
  if (score >= 70) return "ARCHIVE";
  if (score >= 40) return "REVIEW";
  if (score >= 20) return "OPTIMIZE";
  return "KEEP";
}

app.post("/api/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
          quality_analysis: true,
          phash: true
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      stream.end(req.file.buffer);
    });

    const score = calculateWasteScore(result);

    res.json({
      success: true,
      asset: {
        name: result.original_filename,
        url: result.secure_url,
        width: result.width,
        height: result.height,
        size: result.bytes,
        format: result.format,
        focus: result.quality_analysis?.focus ?? null,
        phash: result.phash ?? null,
        wasteScore: score,
        recommendation: recommendation(score)
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Upload or Cloudinary analysis failed"
    });
  }
});

app.get("/", (req, res) => {
  res.send("MediaGuard AI Backend is running!");
});

app.listen(process.env.PORT || 5000, () => {
  console.log("MediaGuard AI running on port 5000");
});
