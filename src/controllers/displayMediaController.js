const DisplayMedia = require("../models/DisplayMedia");
const response = require("../utils/response");
const { deleteImage } = require("../config/cloudinary");
const { uploadToCloudinary } = require("../utils/uploadToCloudinary");
const asyncHandler = require("../middlewares/asyncHandler");

let io;

// ✅ Set WebSocket instance
exports.setSocketIo = (socketIoInstance) => {
  io = socketIoInstance;
};

// ✅ Emit updated media list to all screens (if needed)
const emitMediaUpdate = async () => {
  try {
    if (!io) throw new Error("WebSocket instance (io) is not initialized.");
    const allMedia = await DisplayMedia.find().sort({ createdAt: -1 });
    io.emit("mediaUpdate", allMedia);
  } catch (err) {
    console.error("❌ Failed to emit media update:", err.message);
  }
};

// ✅ Get all media
exports.getDisplayMedia = asyncHandler(async (req, res) => {
  const items = await DisplayMedia.find().sort({ createdAt: -1 });
  return response(res, 200, items.length ? "Media fetched." : "No media found.", items);
});

// ✅ Get a single media item
exports.getMediaById = asyncHandler(async (req, res) => {
  const media = await DisplayMedia.findById(req.params.id);
  if (!media) return response(res, 404, "Media not found.");
  return response(res, 200, "Media retrieved.", media);
});

// ✅ Create new display media
exports.createDisplayMedia = asyncHandler(async (req, res) => {
  const { category, subcategory } = req.body;

  if (!req.file) return response(res, 400, "No media file uploaded.");

  const uploaded = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
  const media = await DisplayMedia.create({
    category,
    subcategory,
    media: {
      type: uploaded.resource_type, // "image" or "video"
      url: uploaded.secure_url,
    },
  });

  await emitMediaUpdate();
  return response(res, 201, "Media created successfully.", media);
});

// ✅ Update media entry
exports.updateDisplayMedia = asyncHandler(async (req, res) => {
  const item = await DisplayMedia.findById(req.params.id);
  if (!item) return response(res, 404, "Media item not found.");

  const { category, subcategory } = req.body;

  if (category) item.category = category;
  if (subcategory) item.subcategory = subcategory;

  // Handle replacement file
  if (req.file) {
    await deleteImage(item.media.url);
    const uploaded = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    item.media = {
      type: uploaded.resource_type,
      url: uploaded.secure_url,
    };
  }

  await item.save();
  await emitMediaUpdate();
  return response(res, 200, "Media updated successfully.", item);
});

// ✅ Delete media
exports.deleteDisplayMedia = asyncHandler(async (req, res) => {
  const item = await DisplayMedia.findById(req.params.id);
  if (!item) return response(res, 404, "Media not found.");

  if (item.media?.url) await deleteImage(item.media.url);

  await item.deleteOne();
  await emitMediaUpdate();
  return response(res, 200, "Media deleted successfully.");
});
