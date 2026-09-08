import mongoose from "mongoose";
import { logger } from "./logger";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is required");
}

let isConnected = false;

export async function connectMongo(): Promise<void> {
  if (isConnected) return;
  await mongoose.connect(MONGODB_URI as string, {
    serverSelectionTimeoutMS: 10000,
  });
  isConnected = true;
  logger.info("MongoDB connected");
}

const movieSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, index: true },
    year: { type: Number, default: null },
    genre: { type: [String], default: [] },
    language: { type: String, default: null },
    quality: { type: String, default: null },
    poster: { type: String, default: null },
    backdrop: { type: String, default: null },
    overview: { type: String, default: null },
    rating: { type: Number, default: null },
    imdbId: { type: String, default: null },
    fileId: { type: String, default: null },
    fileSize: { type: Number, default: null },
    caption: { type: String, default: null },
    // filterbotzx compatibility fields
    file_name: { type: String, default: null },
    file_size: { type: Number, default: null },
    file_id: { type: String, default: null },
    languages: { type: [String], default: [] },
    file_type: { type: String, default: null },
    message_id: { type: Number, default: null },
    chat_id: { type: Number, default: null },
  },
  {
    timestamps: { createdAt: "addedAt", updatedAt: "updatedAt" },
  }
);

movieSchema.index({ title: "text", caption: "text", file_name: "text" });
movieSchema.index({ genre: 1 });
movieSchema.index({ language: 1 });
movieSchema.index({ quality: 1 });
movieSchema.index({ addedAt: -1 });
movieSchema.index({ rating: -1 });

// The bot (ia_filterdb.py) saves to COLLECTION_NAME, defaulting to "test".
// The web app reads from the same collection. In production set COLLECTION_NAME=Media.
const mainCollectionName = process.env.COLLECTION_NAME || "test";

export const MovieModel =
  mongoose.models.Media ||
  mongoose.model("Media", movieSchema, mainCollectionName);

// For the Telegram file lookup we need a schema-less model on the same collection
// (bot docs have string _id = file_id and no TMDB fields).
const botFileSchema = new mongoose.Schema({}, { strict: false });

export const BotFileModel =
  mongoose.models.BotFile ||
  mongoose.model("BotFile", botFileSchema, mainCollectionName);

const adminSettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: { type: String, default: "" },
  },
  { timestamps: true }
);

export const AdminSettingModel =
  mongoose.models.AdminSetting ||
  mongoose.model("AdminSetting", adminSettingSchema, "AdminSettings");
