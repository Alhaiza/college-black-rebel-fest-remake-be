import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ENV } from "./config/env.js";
import { User } from "./models/user.model.js";
import { TicketTier } from "./models/ticketTier.model.js";
import { Lineup } from "./models/lineup.model.js";

const seedDatabase = async () => {
  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log("🌱 Connected to database for seeding...");

    // 1. Seed Ticket Tiers
    await TicketTier.deleteMany({});
    const tiers = await TicketTier.insertMany([
      {
        name: "Bronze",
        price: 250000,
        totalQuota: 500,
        availableQuota: 500,
        perks: ["Regular Entry", "Access to Day 1 & Day 2", "Standard Stage View"],
      },
      {
        name: "Silver",
        price: 450000,
        totalQuota: 300,
        availableQuota: 300,
        perks: ["Priority Entry", "Closer Stage Area", "Free Festival Wristband", "Food Court Voucher"],
      },
      {
        name: "Gold",
        price: 750000,
        totalQuota: 100,
        availableQuota: 100,
        perks: ["VIP Front-row Access", "Exclusive BRF Merchandise", "VIP Lounge & Bar Access", "Dedicated Fast-lane Gate"],
      },
    ]);
    console.log("✅ Seeded Ticket Tiers:", tiers.length);

    // 2. Seed Lineup
    await Lineup.deleteMany({});
    const lineups = await Lineup.insertMany([
      {
        artistName: "Slipknot",
        day: 1,
        stage: "Chaos Stage (Main)",
        timeSlot: "21:00 - 23:00",
        imageUrl: "/img/LineUp/LineUp_Slipknot.jpg",
        description: "Legendary heavy metal powerhouse headlining Night 1.",
      },
      {
        artistName: "The Panturas",
        day: 1,
        stage: "Rebel Stage",
        timeSlot: "19:00 - 20:30",
        imageUrl: "/img/LineUp/LineUp_ThePanthuras.jpeg",
        description: "Indonesian surf rock sensation bringing ocean waves to moshpits.",
      },
      {
        artistName: "Neck Deep",
        day: 1,
        stage: "Chaos Stage (Main)",
        timeSlot: "17:30 - 18:45",
        imageUrl: "/img/LineUp/LineUp_NeckDeep.jpg",
        description: "Welsh pop-punk icons bringing anthems to sing along to.",
      },
      {
        artistName: "Twice",
        day: 2,
        stage: "Chaos Stage (Main)",
        timeSlot: "20:30 - 22:30",
        imageUrl: "/img/LineUp/LineUp_Twice.jpg",
        description: "Global K-pop phenomenon delivering high-energy performance.",
      },
      {
        artistName: "Dream Theater",
        day: 2,
        stage: "Chaos Stage (Main)",
        timeSlot: "18:00 - 20:00",
        imageUrl: "/img/LineUp/LineUp_DreamTheater.jpg",
        description: "Masters of progressive metal virtuosity.",
      },
      {
        artistName: "Bilal Indrajaya",
        day: 2,
        stage: "Sunset Stage",
        timeSlot: "16:30 - 17:30",
        imageUrl: "/img/LineUp/LineUp_BilalIndraJaya.jpg",
        description: "Soulful indie-pop melodies to warm up the afternoon.",
      },
      {
        artistName: "Yoasobi",
        day: 3,
        stage: "Chaos Stage (Main)",
        timeSlot: "21:00 - 22:30",
        imageUrl: "/img/LineUp/LineUp_Yoasobi.jpg",
        description: "Japanese music duo creating novels into music.",
      },
      {
        artistName: "Reality Club",
        day: 3,
        stage: "Rebel Stage",
        timeSlot: "19:00 - 20:30",
        imageUrl: "/img/LineUp/LineUp_RealityClub.webp",
        description: "Indie rock melodies crafted with cinematic storytelling.",
      },
      {
        artistName: "Liella!",
        day: 3,
        stage: "Sunset Stage",
        timeSlot: "17:00 - 18:30",
        imageUrl: "/img/LineUp/LineUp_Liella.webp",
        description: "Vibrant and energetic idol stage performance.",
      },
    ]);
    console.log("✅ Seeded Lineups:", lineups.length);

    // 3. Seed Sample User
    const existingAdmin = await User.findOne({ username: "admin" });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash("admin123", 10);
      await User.create({
        username: "admin",
        email: "admin@brf.local",
        passwordHash,
        role: "admin",
      });
      console.log("✅ Seeded Default Admin (username: admin, password: admin123)");
    }

    console.log("✨ Database seeding complete!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err);
    process.exit(1);
  }
};

seedDatabase();

