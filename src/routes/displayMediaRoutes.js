const express = require("express");
const {
  createDisplayMedia,
  updateDisplayMedia,
  deleteDisplayMedia,
  getDisplayMedia,
  getMediaById,
} = require("../controllers/displayMediaController");

const { protect, adminOnly } = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");

const router = express.Router();

router.get("/", getDisplayMedia);
router.get("/:id", getMediaById);

router.post("/", protect, adminOnly, upload.single("media"), createDisplayMedia);
router.put("/:id", protect, adminOnly, upload.single("media"), updateDisplayMedia);
router.delete("/:id", protect, adminOnly, deleteDisplayMedia); 

module.exports = router;
