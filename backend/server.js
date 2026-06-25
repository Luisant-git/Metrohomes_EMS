import express from "express";
import cors from "cors";
import apiRoutes from "./routes/api.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({ origin: ["http://localhost:5173", "http://localhost:4173"] }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use("/api", apiRoutes);

app.get("/", (_req, res) => {
  res.json({
    name: "RealEstate EMS API",
    version: "1.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
    endpoints: ["/api/users", "/api/sites", "/api/customers", "/api/visits", "/api/bookings"],
  });
});

app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));

app.listen(PORT, () => {
    console.log(`✅ RealEstate EMS API running at http://localhost:${PORT}`);
});
