// updateImageURLs.js
const mongoose = require("mongoose");
require("dotenv").config();

const MONGO_URL = process.env.MONGO_URL;

// Use existing collection name "products" (the collection name in MongoDB)
const Product = mongoose.model("Product", new mongoose.Schema({}, { strict: false }), "products");

mongoose
  .connect(MONGO_URL)
  .then(async () => {
    console.log("✅ Connected to MongoDB");

    const result = await Product.updateMany(
      { image: { $regex: "^http://localhost:4000" } },
      [
        {
          $set: {
            image: {
              $replaceOne: {
                input: "$image",
                find: "http://localhost:4000",
                replacement: "https://ecommerce-mern-hlm8.onrender.com",
              },
            },
          },
        },
      ]
    );

    console.log("✅ Modified documents:", result.modifiedCount);
    mongoose.disconnect();
  })
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
  });
