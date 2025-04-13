const DisplayMedia = require("../models/DisplayMedia");

const categoryOptions = {
  "About OSHRM": ["About OSHRM", "Why OSHRM"],
  "OSHRM People": ["Board", "Team"],
  "Success Stories": [],
  Partners: [],
  "Professional Certifications": [],
  Upcoming: ["Coming soon", "Rest of the year"],
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
    
      const hasSubcategories = categoryOptions[category]?.length > 0;
    
      // Show animation if:
      // 1. Category has subcategories AND subcategory is selected
      // OR
      // 2. Category has NO subcategories
      const shouldShowLoading = (hasSubcategories && subcategory) || !hasSubcategories;
    
      if (shouldShowLoading) {
        console.log("🚀 Backend is emitting 'categorySelected'");
        io.emit("categorySelected");
      } else {
        console.log("⚠️ Backend NOT emitting 'categorySelected'");
      }
    
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
      }, shouldShowLoading ? 1000 : 0); // only delay if loading shown
    });
    
    socket.on("disconnect", (reason) => {
      console.log(`❌ Client disconnected: ${socket.id} - Reason: ${reason}`);
    });
  });
};

module.exports = socketHandler;
