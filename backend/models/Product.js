import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { 
    type: String, 
    enum: ["Vegetables", "Fruits", "Grains", "Pulses", "Spices", "Others"], 
    required: true 
  },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  unit: { 
    type: String, 
    enum: ["kg", "quintal", "ton", "bag", "piece"], 
    default: "kg" 
  },
  quality: { 
    type: String, 
    enum: ["A", "B", "C"], 
    default: "A" 
  },
  harvestDate: { type: Date },
  location: {
    city: String,
    state: String,
    pincode: String,
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  images: [{ type: String }],
  seller: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["available", "sold", "reserved"], 
    default: "available" 
  },
  views: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("Product", productSchema);