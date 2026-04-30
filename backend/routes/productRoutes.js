import express from "express";
import Product from "../models/Product.js";
import { authMiddleware } from "../middleware/auth.js";

const router = express.Router();

const normalize = (value = "") => String(value || "").trim().toLowerCase();

const toKmDistance = (from, to) => {
  if (!from?.lat || !from?.lng || !to?.lat || !to?.lng) return null;
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Get all products with filters and sorting
router.get("/", async (req, res) => {
  try {
    const {
      category, minPrice, maxPrice, quality,
      sortBy = "createdAt", order = "desc",
      search, city, state,
      lat, lng, radius   // radius in km; 0 = worldwide
    } = req.query;

    let filter = { status: "available" };

    if (category) filter.category = category;
    if (quality)  filter.quality  = quality;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (city)  filter["location.city"]  = new RegExp(city,  "i");
    if (state) filter["location.state"] = new RegExp(state, "i");
    if (search) {
      filter.$or = [
        { title:       new RegExp(search, "i") },
        { description: new RegExp(search, "i") }
      ];
    }

    const sortOrder = order === "asc" ? 1 : -1;
    let products = await Product.find(filter)
      .populate("seller", "fname lname email role profileImage")
      .sort({ [sortBy]: sortOrder });

    // Client-side geo filter (Haversine) when lat/lng + radius provided
    if (lat && lng && radius && Number(radius) > 0) {
      const userLat = Number(lat);
      const userLng = Number(lng);
      const maxKm   = Number(radius);

      const toRad = d => (d * Math.PI) / 180;
      const haversine = (lat1, lng1, lat2, lng2) => {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a = Math.sin(dLat/2)**2 +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2)**2;
        return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      };

      products = products
        .filter(p => {
          const c = p.location?.coordinates;
          if (!c?.lat || !c?.lng) return false; // radius filter requires coordinates
          return haversine(userLat, userLng, c.lat, c.lng) <= maxKm;
        })
        .map(p => {
          const c = p.location?.coordinates;
          if (c?.lat && c?.lng) {
            const dist = haversine(userLat, userLng, c.lat, c.lng);
            return { ...p.toObject(), distance: Math.round(dist) };
          }
          return p.toObject();
        })
        .sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999));
    }

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get single product by ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("seller", "fname lname email role");
    
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Increment views
    product.views += 1;
    await product.save();

    res.json(product);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get recommendations for a product page
router.get("/:id/recommendations", async (req, res) => {
  try {
    const currentProduct = await Product.findById(req.params.id)
      .populate("seller", "fname lname email role");

    if (!currentProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const excludeIds = [currentProduct._id];

    const sameFarmer = await Product.find({
      _id: { $ne: currentProduct._id },
      seller: currentProduct.seller?._id,
      status: "available"
    })
      .populate("seller", "fname lname email role")
      .sort({ createdAt: -1 })
      .limit(6)
      .lean();

    sameFarmer.forEach((p) => excludeIds.push(p._id));

    const currentCity = normalize(currentProduct.location?.city);
    const currentState = normalize(currentProduct.location?.state);
    const currentCoords = currentProduct.location?.coordinates;

    const nearbyPool = await Product.find({
      _id: { $nin: excludeIds },
      category: currentProduct.category,
      status: "available"
    })
      .populate("seller", "fname lname email role")
      .sort({ createdAt: -1 })
      .limit(40)
      .lean();

    const nearby = nearbyPool
      .map((item) => {
        const itemCity = normalize(item.location?.city);
        const itemState = normalize(item.location?.state);
        const cityMatch = currentCity && itemCity && currentCity === itemCity;
        const stateMatch = currentState && itemState && currentState === itemState;
        const distance = toKmDistance(currentCoords, item.location?.coordinates);

        return {
          ...item,
          distance,
          _score: cityMatch ? 3 : stateMatch ? 2 : 1
        };
      })
      .sort((a, b) => {
        if (b._score !== a._score) return b._score - a._score;
        if ((a.distance ?? Number.MAX_SAFE_INTEGER) !== (b.distance ?? Number.MAX_SAFE_INTEGER)) {
          return (a.distance ?? Number.MAX_SAFE_INTEGER) - (b.distance ?? Number.MAX_SAFE_INTEGER);
        }
        return new Date(b.createdAt) - new Date(a.createdAt);
      })
      .slice(0, 6)
      .map(({ _score, ...rest }) => rest);

    res.json({
      sameFarmer,
      nearby,
      baseProductId: currentProduct._id
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create new product (only for farmers)
router.post("/", authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== "farmer") {
      return res.status(403).json({ message: "Only farmers can create products" });
    }

    const productData = {
      ...req.body,
      seller: req.user.id
    };

    const newProduct = new Product(productData);
    await newProduct.save();

    res.status(201).json({ message: "Product created successfully", product: newProduct });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Update product
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only update your own products" });
    }

    const updatableFields = [
      "title", "description", "category", "price", "quantity", "unit",
      "quality", "harvestDate", "images", "status"
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    });

    if (req.body.location) {
      const currentLocation = product.location?.toObject?.() ?? product.location ?? {};
      const incomingLocation = req.body.location;
      const mergedCoordinates = incomingLocation.coordinates !== undefined
        ? {
            lat: incomingLocation.coordinates?.lat,
            lng: incomingLocation.coordinates?.lng
          }
        : currentLocation.coordinates;

      product.location = {
        ...currentLocation,
        ...incomingLocation,
        ...(mergedCoordinates ? { coordinates: mergedCoordinates } : {})
      };
    }

    await product.save();

    res.json({ message: "Product updated successfully", product });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete product
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.seller.toString() !== req.user.id) {
      return res.status(403).json({ message: "You can only delete your own products" });
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get user's products
router.get("/user/my-products", authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ seller: req.user.id })
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

export default router;