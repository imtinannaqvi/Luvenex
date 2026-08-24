import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "../models/User"; // adjust path to match your actual model file

dotenv.config();

function generateHandle(name) {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

async function run() {
  await mongoose.connect(process.env.MONGO_URI); // adjust to your actual env var name

  const usersWithoutHandle = await User.find({
    $or: [{ handle: { $exists: false } }, { handle: null }],
  });

  console.log(`Found ${usersWithoutHandle.length} users missing a handle.`);

  for (const user of usersWithoutHandle) {
    let handle;
    let attempts = 0;
    do {
      handle = generateHandle(user.name || "user");
      attempts++;
    } while ((await User.findOne({ handle })) && attempts < 5);

    user.handle = handle;
    await user.save();
    console.log(`Set handle "${handle}" for ${user.email}`);
  }

  console.log("Backfill complete.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});