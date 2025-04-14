const DisplayMedia = require("../models/DisplayMedia");

const categoryOptions = {
  "About OSHRM": ["About OSHRM", "Why OSHRM", "OSHRM Arms"],
  "OSHRM People": ["Board", "Team"],
  "Success Stories": ["Success Stories", "Conferences"],
  Partners: ["2025 Sponsors", "Partners"],
  "Professional Certifications": [],
  Upcoming: ["Coming soon", "2025 Calendar"],
};

const socketHandler = (io) => {
  io.on("connection", async (socket) => {
    console.log(`🔵 New client attempted to connect: ${socket.id}`);

    socket.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    // 🔁 Send all display media to all clients
    const sendInitialMedia = async () => {
      try {
        const media = await DisplayMedia.find().sort({ createdAt: -1 });
        io.emit("mediaUpdate", media);
      } catch (error) {
        console.error("❌ Failed to send media on init:", error);
      }
    };

    await sendInitialMedia();

    socket.on("register", async (role) => {
      socket.role = role;
      console.log(`👤 Client ${socket.id} registered as ${role}`);

      try {
        const media = await DisplayMedia.find().sort({ createdAt: -1 });
        socket.emit("mediaUpdate", media);
      } catch (error) {
        console.error("❌ Failed to emit media on register:", error);
      }
    });

    // ✅ When controller selects a category/subcategory
    socket.on("selectCategory", async ({ category, subcategory }) => {
      console.log(`📂 Category selected: ${category} > ${subcategory}`);

      // 1) Check if category has subcategories
      const hasSubcategories = categoryOptions[category]?.length > 0;

      const shouldShowLoading = hasSubcategories ? !!subcategory : true;

      if (shouldShowLoading) {
        console.log("🚀 Backend is emitting 'categorySelected'");
        io.emit("categorySelected");
      } else {
        console.log("⚠️ Backend NOT emitting 'categorySelected'");
      }

      // Delay the media display by 1s if we're showing loading
      setTimeout(async () => {
        try {
          const media = await DisplayMedia.findOne({ category, subcategory });
          if (media) {
            io.emit("displayMedia", media);
          } else {
            console.log("⚠️ No media found for this category.");
            io.emit("displayMedia", null);
          }
        } catch (err) {
          console.error("❌ Error fetching media:", err);
          io.emit("displayMedia", null);
        }
      }, shouldShowLoading ? 1000 : 0);
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} - Reason: ${reason}`);
    });
  });
};

module.exports = socketHandler;
