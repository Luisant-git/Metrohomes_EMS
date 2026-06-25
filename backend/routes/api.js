import express from "express";
const router = express.Router();

// ─── In-memory data ───────────────────────────────────────────────────────────
let users = [
  { id: 1, name: "Arjun Mehta", email: "admin@realestate.com", role: "Admin", mobile: "9876543210", status: "Active", region: null, branch: null },
  { id: 2, name: "Priya Sharma", email: "director@realestate.com", role: "Director", mobile: "9876543211", status: "Active", region: "North", branch: null },
  { id: 3, name: "Rajesh Kumar", email: "rm@realestate.com", role: "Regional Manager", mobile: "9876543212", status: "Active", region: "North", branch: null },
  { id: 4, name: "Sunita Patel", email: "bm@realestate.com", role: "Branch Manager", mobile: "9876543213", status: "Active", region: "North", branch: "Delhi HQ" },
  { id: 5, name: "Vikram Singh", email: "bdm@realestate.com", role: "BDM", mobile: "9876543214", status: "Active", region: "North", branch: "Delhi HQ" },
  { id: 6, name: "Anjali Verma", email: "sm@realestate.com", role: "Sales Manager", mobile: "9876543215", status: "Active", region: "North", branch: "Delhi HQ" },
];

let sites = [
  { id: 1, name: "Green Valley Residency", location: "Sector 62, Noida", type: "Residential", totalPlots: 120, availablePlots: 45, pricePerSqft: 5500, totalArea: "25 Acres", status: "Active", approved: true },
  { id: 2, name: "Sunrise Commercial Hub", location: "Dwarka, Delhi", type: "Commercial", totalPlots: 60, availablePlots: 20, pricePerSqft: 12000, totalArea: "10 Acres", status: "Active", approved: true },
];

let customers = [
  { id: 1, name: "Ramesh Gupta", mobile: "9811234567", status: "Booked", siteId: 1, salesManagerId: 6, visitDate: "2024-04-10", registeredDate: "2024-04-05" },
];

let bookings = [
  { id: 1, customerId: 1, customerName: "Ramesh Gupta", siteId: 1, plotNo: "A-12", plotPrice: 11000000, paidAmount: 5000000, remainingAmount: 6000000, status: "Booked", bookingDate: "2024-04-12", invoiceNo: "INV-2024-001" },
];

let visits = [
  { id: 1, customerId: 1, customerName: "Ramesh Gupta", siteId: 1, visitDate: "2024-04-10", status: "Visit Completed", salesManagerId: 6 },
];

// ─── USERS ────────────────────────────────────────────────────────────────────
router.get("/users", (_req, res) => res.json({ success: true, data: users }));
router.get("/users/:id", (req, res) => {
  const user = users.find(u => u.id === +req.params.id);
  if (!user) return res.status(404).json({ success: false, message: "User not found" });
  res.json({ success: true, data: user });
});
router.post("/users", (req, res) => {
  const user = { ...req.body, id: Date.now(), joinDate: new Date().toISOString().split("T")[0] };
  users.push(user);
  res.status(201).json({ success: true, data: user, message: "User created" });
});
router.put("/users/:id", (req, res) => {
  const idx = users.findIndex(u => u.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "User not found" });
  users[idx] = { ...users[idx], ...req.body };
  res.json({ success: true, data: users[idx], message: "User updated" });
});
router.delete("/users/:id", (req, res) => {
  const id = +req.params.id;
  if (!users.some(u => u.id === id)) return res.status(404).json({ success: false, message: "User not found" });
  users = users.filter(u => u.id !== id);
  res.json({ success: true, message: "User deleted", deletedId: id });
});

// ─── SITES ────────────────────────────────────────────────────────────────────
router.get("/sites", (_req, res) => res.json({ success: true, data: sites }));
router.get("/sites/:id", (req, res) => {
  const site = sites.find(s => s.id === +req.params.id);
  if (!site) return res.status(404).json({ success: false, message: "Site not found" });
  res.json({ success: true, data: site });
});
router.post("/sites", (req, res) => {
  const site = { ...req.body, id: Date.now(), approved: false, createdAt: new Date().toISOString().split("T")[0] };
  sites.push(site);
  res.status(201).json({ success: true, data: site, message: "Site created (pending approval)" });
});
router.put("/sites/:id", (req, res) => {
  const idx = sites.findIndex(s => s.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Site not found" });
  sites[idx] = { ...sites[idx], ...req.body };
  res.json({ success: true, data: sites[idx], message: "Site updated" });
});
router.patch("/sites/:id/approve", (req, res) => {
  const idx = sites.findIndex(s => s.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Site not found" });
  sites[idx] = { ...sites[idx], approved: true, status: "Active" };
  res.json({ success: true, data: sites[idx], message: "Site approved" });
});
router.delete("/sites/:id", (req, res) => {
  const id = +req.params.id;
  sites = sites.filter(s => s.id !== id);
  res.json({ success: true, message: "Site deleted", deletedId: id });
});

// ─── CUSTOMERS ────────────────────────────────────────────────────────────────
router.get("/customers", (_req, res) => res.json({ success: true, data: customers }));
router.post("/customers", (req, res) => {
  const c = { ...req.body, id: Date.now(), registeredDate: new Date().toISOString().split("T")[0] };
  customers.push(c);
  res.status(201).json({ success: true, data: c, message: "Customer registered" });
});
router.put("/customers/:id", (req, res) => {
  const idx = customers.findIndex(c => c.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Customer not found" });
  customers[idx] = { ...customers[idx], ...req.body };
  res.json({ success: true, data: customers[idx], message: "Customer updated" });
});
router.delete("/customers/:id", (req, res) => {
  const id = +req.params.id;
  customers = customers.filter(c => c.id !== id);
  res.json({ success: true, message: "Customer deleted" });
});

// ─── VISITS ───────────────────────────────────────────────────────────────────
router.get("/visits", (_req, res) => res.json({ success: true, data: visits }));
router.post("/visits", (req, res) => {
  const v = { ...req.body, id: Date.now() };
  visits.push(v);
  res.status(201).json({ success: true, data: v, message: "Visit registered" });
});
router.put("/visits/:id", (req, res) => {
  const idx = visits.findIndex(v => v.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Visit not found" });
  visits[idx] = { ...visits[idx], ...req.body };
  res.json({ success: true, data: visits[idx], message: "Visit updated" });
});

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────
router.get("/bookings", (_req, res) => res.json({ success: true, data: bookings }));
router.post("/bookings", (req, res) => {
  const b = { ...req.body, id: Date.now(), bookingDate: new Date().toISOString().split("T")[0], invoiceNo: `INV-${Date.now()}` };
  bookings.push(b);
  res.status(201).json({ success: true, data: b, message: "Booking created. WhatsApp notification sent." });
});
router.put("/bookings/:id", (req, res) => {
  const idx = bookings.findIndex(b => b.id === +req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, message: "Booking not found" });
  bookings[idx] = { ...bookings[idx], ...req.body };
  res.json({ success: true, data: bookings[idx], message: "Booking updated" });
});

// ─── COMMISSION ───────────────────────────────────────────────────────────────
router.get("/commission", (_req, res) => {
  const rates = { Director: 1.5, "Regional Manager": 1.0, "Branch Manager": 0.75, BDM: 0.5, "Sales Manager": 0.25 };
  const summary = bookings.map(b => ({
    bookingId: b.id, customerName: b.customerName, plotPrice: b.plotPrice,
    commission: Object.fromEntries(Object.entries(rates).map(([role, rate]) => [role, Math.round((b.plotPrice * rate) / 100)])),
  }));
  res.json({ success: true, data: { rates, summary } });
});

// ─── ACHIEVERS ────────────────────────────────────────────────────────────────
router.get("/achievers", (_req, res) => {
  const rankings = [
    { rank: 1, name: "Priya Sen", sales: 14, revenue: 308000000, points: 1400 },
    { rank: 2, name: "Anjali Verma", sales: 12, revenue: 264000000, points: 1200 },
    { rank: 3, name: "Neha Mishra", sales: 11, revenue: 242000000, points: 1100 },
  ];
  res.json({ success: true, data: rankings });
});

export default router;
