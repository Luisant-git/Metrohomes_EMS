import { createContext, useContext, useState } from "react";

const DataContext = createContext(null);

// ─── Mock Data ────────────────────────────────────────────────────────────────
const INITIAL_SITES = [
  {
    id: 1, name: "Green Valley Residency", location: "Sector 62, Noida", type: "Residential",
    totalPlots: 120, availablePlots: 45, pricePerSqft: 5500, totalArea: "25 Acres",
    status: "Active", approved: true, amenities: ["Swimming Pool", "Gym", "Park", "Security"],
    images: ["https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
             "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80"],
    brochure: "#", description: "Premium residential plots with world-class amenities in the heart of Noida.",
    lat: 28.6129, lng: 77.3695, createdAt: "2024-01-15",
  },
  {
    id: 2, name: "Sunrise Commercial Hub", location: "Dwarka, Delhi", type: "Commercial",
    totalPlots: 60, availablePlots: 20, pricePerSqft: 12000, totalArea: "10 Acres",
    status: "Active", approved: true, amenities: ["Parking", "Power Backup", "Broadband", "Cafeteria"],
    images: ["https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
             "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80"],
    brochure: "#", description: "Strategic commercial spaces in Dwarka with excellent connectivity.",
    lat: 28.5921, lng: 77.0460, createdAt: "2024-02-10",
  },
  {
    id: 3, name: "Blue Lagoon Villas", location: "Gurgaon Sector 48", type: "Villa",
    totalPlots: 30, availablePlots: 8, pricePerSqft: 18000, totalArea: "15 Acres",
    status: "Pending", approved: false, amenities: ["Private Pool", "Garden", "Club House", "24/7 Security"],
    images: ["https://images.unsplash.com/photo-1613977257363-707ba9348227?w=800&q=80"],
    brochure: "#", description: "Luxury villas with private pools and lush green surroundings.",
    lat: 28.4089, lng: 77.0421, createdAt: "2024-03-05",
  },
  {
    id: 4, name: "Emerald Heights", location: "Faridabad, Haryana", type: "Residential",
    totalPlots: 200, availablePlots: 150, pricePerSqft: 3800, totalArea: "40 Acres",
    status: "Active", approved: true, amenities: ["Park", "School", "Hospital Nearby", "Metro Access"],
    images: ["https://images.unsplash.com/photo-1523217582562-09d0def993a6?w=800&q=80"],
    brochure: "#", description: "Affordable residential plots with excellent infrastructure.",
    lat: 28.4089, lng: 77.3178, createdAt: "2024-01-20",
  },
];

// Customers assigned to specific Sales Managers
const INITIAL_CUSTOMERS = [
  // Anjali Verma (SM-001, id:6) - 2 customers
  { id: 1, name: "Ramesh Gupta", mobile: "9811234567", email: "ramesh@email.com", address: "Lajpat Nagar, Delhi", status: "Booked", siteId: 1, siteName: "Green Valley Residency", salesManagerId: 6, salesManagerName: "Anjali Verma", visitDate: "2024-04-10", registeredDate: "2024-04-05", notes: "Interested in corner plot" },
  { id: 2, name: "Meena Agarwal", mobile: "9822345678", email: "meena@email.com", address: "Rohini, Delhi", status: "Visit Completed", siteId: 1, siteName: "Green Valley Residency", salesManagerId: 6, salesManagerName: "Anjali Verma", visitDate: "2024-04-15", registeredDate: "2024-04-12", notes: "Wants 200 sq yard plot" },
  
  // Rahul Verma (SM-002, id:20) - 1 customer
  { id: 7, name: "Suresh Bhatia", mobile: "9833456789", email: "suresh@email.com", address: "Vasant Kunj, Delhi", status: "Interested", siteId: 2, siteName: "Sunrise Commercial Hub", salesManagerId: 20, salesManagerName: "Rahul Verma", visitDate: "2024-04-20", registeredDate: "2024-04-18", notes: "Looking for office space" },
  
  // Karthik Nair (SM-003, id:21) - 1 customer
  { id: 8, name: "Kavita Joshi", mobile: "9844567890", email: "kavita@email.com", address: "Noida Sec 15", status: "Ready for Booking", siteId: 3, siteName: "Blue Lagoon Villas", salesManagerId: 21, salesManagerName: "Karthik Nair", visitDate: "2024-04-08", registeredDate: "2024-04-01", notes: "Premium villa preferred" },
  
  // Naveen Reddy (SM-004, id:22) - 1 customer
  { id: 9, name: "Deepak Nair", mobile: "9855678901", email: "deepak@email.com", address: "Sector 12, Gurgaon", status: "Dropped", siteId: 1, siteName: "Green Valley Residency", salesManagerId: 22, salesManagerName: "Naveen Reddy", visitDate: "2024-03-25", registeredDate: "2024-03-20", notes: "Budget constraint" },
  
  // Ajay Singh (SM-005, id:23) - 1 customer
  { id: 10, name: "Pooja Mehrotra", mobile: "9866789012", email: "pooja@email.com", address: "Indirapuram, Ghaziabad", status: "Payment Done", siteId: 4, siteName: "Emerald Heights", salesManagerId: 23, salesManagerName: "Ajay Singh", visitDate: "2024-03-15", registeredDate: "2024-03-10", notes: "Plot no. 45 confirmed", paymentAmount: 7600000, invoiceNo: "INV-2024-001" },
  
  // Suresh Pal (SM-006, id:24) - 1 customer
  { id: 11, name: "Anita Sharma", mobile: "9876543299", email: "anita@email.com", address: "Dwarka, Delhi", status: "Booked", siteId: 2, siteName: "Sunrise Commercial Hub", salesManagerId: 24, salesManagerName: "Suresh Pal", visitDate: "2024-05-01", registeredDate: "2024-04-25", notes: "Commercial space for clinic" },
  
  // Lata Mehta (SM-007, id:25) - 1 customer
  { id: 12, name: "Vijay Malhotra", mobile: "9876543300", email: "vijay@email.com", address: "Noida Sector 62", status: "Visit Scheduled", siteId: 1, siteName: "Green Valley Residency", salesManagerId: 25, salesManagerName: "Lata Mehta", visitDate: "2024-05-10", registeredDate: "2024-05-05", notes: "Wants 2 plots side by side" },
];

const INITIAL_BOOKINGS = [
  { id: 1, customerId: 1, customerName: "Ramesh Gupta", siteId: 1, siteName: "Green Valley Residency", plotNo: "A-12", plotArea: 200, plotPrice: 11000000, paidAmount: 5000000, remainingAmount: 6000000, status: "Booked", salesManagerId: 6, salesManagerName: "Anjali Verma", bookingDate: "2024-04-12", invoiceNo: "INV-2024-002" },
  { id: 2, customerId: 10, customerName: "Pooja Mehrotra", siteId: 4, siteName: "Emerald Heights", plotNo: "B-45", plotArea: 200, plotPrice: 7600000, paidAmount: 7600000, remainingAmount: 0, status: "Payment Done", salesManagerId: 23, salesManagerName: "Ajay Singh", bookingDate: "2024-03-18", invoiceNo: "INV-2024-001" },
  { id: 3, customerId: 11, customerName: "Anita Sharma", siteId: 2, siteName: "Sunrise Commercial Hub", plotNo: "C-08", plotArea: 150, plotPrice: 18000000, paidAmount: 9000000, remainingAmount: 9000000, status: "Booked", salesManagerId: 24, salesManagerName: "Suresh Pal", bookingDate: "2024-05-02", invoiceNo: "INV-2024-003" },
];

const INITIAL_VISITS = [
  { id: 1, customerId: 1, customerName: "Ramesh Gupta", siteId: 1, siteName: "Green Valley Residency", visitDate: "2024-04-10", status: "Visit Completed", salesManagerId: 6, notes: "Customer loved the location" },
  { id: 2, customerId: 2, customerName: "Meena Agarwal", siteId: 1, siteName: "Green Valley Residency", visitDate: "2024-04-15", status: "Visit Completed", salesManagerId: 6, notes: "Wants to bring family next time" },
  { id: 3, customerId: 7, customerName: "Suresh Bhatia", siteId: 2, siteName: "Sunrise Commercial Hub", visitDate: "2024-04-20", status: "Visit Scheduled", salesManagerId: 20, notes: "" },
  { id: 4, customerId: 8, customerName: "Kavita Joshi", siteId: 3, siteName: "Blue Lagoon Villas", visitDate: "2024-04-08", status: "Visit Completed", salesManagerId: 21, notes: "Very interested in villa" },
  { id: 5, customerId: 11, customerName: "Anita Sharma", siteId: 2, siteName: "Sunrise Commercial Hub", visitDate: "2024-05-01", status: "Visit Completed", salesManagerId: 24, notes: "Confirmed booking same day" },
  { id: 6, customerId: 12, customerName: "Vijay Malhotra", siteId: 1, siteName: "Green Valley Residency", visitDate: "2024-05-10", status: "Visit Scheduled", salesManagerId: 25, notes: "" },
];

const INITIAL_USERS = [
  { id: 1, name: "Arjun Mehta", email: "admin@realestate.com", role: "Admin", mobile: "9876543210", employeeCode: "ADM-001", status: "Active", region: "Head Office", branch: null, joinDate: "2023-01-10", parentUserId: null, createdBy: null },
  { id: 2, name: "Priya Sharma", email: "director@realestate.com", role: "Director", mobile: "9876543211", employeeCode: "DIR-001", status: "Active", region: "North", branch: null, joinDate: "2023-02-15", parentUserId: 1, createdBy: 1 },
  { id: 7, name: "Rahul Verma", email: "rahul.dir@realestate.com", role: "Director", mobile: "9876543240", employeeCode: "DIR-002", status: "Active", region: "South", branch: null, joinDate: "2023-03-01", parentUserId: 1, createdBy: 1 },
  { id: 3, name: "Rajesh Kumar", email: "rm@realestate.com", role: "Regional Manager", mobile: "9876543212", employeeCode: "RM-001", status: "Active", region: "North", branch: null, joinDate: "2023-03-20", parentUserId: 2, createdBy: 2 },
  { id: 8, name: "Sanjay Gupta", email: "sanjay.rm@realestate.com", role: "Regional Manager", mobile: "9876543241", employeeCode: "RM-002", status: "Active", region: "South", branch: null, joinDate: "2023-04-01", parentUserId: 7, createdBy: 7 },
  { id: 9, name: "Meena Joshi", email: "meena.rm@realestate.com", role: "Regional Manager", mobile: "9876543242", employeeCode: "RM-003", status: "Active", region: "East", branch: null, joinDate: "2023-04-05", parentUserId: 7, createdBy: 7 },
  { id: 4, name: "Sunita Patel", email: "bm@realestate.com", role: "Branch Manager", mobile: "9876543213", employeeCode: "BM-001", status: "Active", region: "North", branch: "Delhi HQ", joinDate: "2023-04-01", parentUserId: 3, createdBy: 3 },
  { id: 10, name: "Amit Patel", email: "amit.bm@realestate.com", role: "Branch Manager", mobile: "9876543243", employeeCode: "BM-002", status: "Active", region: "South", branch: "Mumbai HQ", joinDate: "2023-04-15", parentUserId: 8, createdBy: 8 },
  { id: 11, name: "Pooja Singh", email: "pooja.bm@realestate.com", role: "Branch Manager", mobile: "9876543244", employeeCode: "BM-003", status: "Active", region: "South", branch: "Bangalore Branch", joinDate: "2023-04-20", parentUserId: 8, createdBy: 8 },
  { id: 12, name: "Ramesh Yadav", email: "ramesh.bm@realestate.com", role: "Branch Manager", mobile: "9876543245", employeeCode: "BM-004", status: "Active", region: "East", branch: "Hyderabad Branch", joinDate: "2023-05-01", parentUserId: 9, createdBy: 9 },
  { id: 5, name: "Vikram Singh", email: "bdm@realestate.com", role: "BDM", mobile: "9876543214", employeeCode: "BDM-001", status: "Active", region: "North", branch: "Delhi HQ", joinDate: "2023-05-10", parentUserId: 4, createdBy: 4 },
  { id: 13, name: "Kiran Kumar", email: "kiran.bdm@realestate.com", role: "BDM", mobile: "9876543246", employeeCode: "BDM-002", status: "Active", region: "South", branch: "Mumbai HQ", joinDate: "2023-05-15", parentUserId: 10, createdBy: 10 },
  { id: 14, name: "Ritu Sharma", email: "ritu.bdm@realestate.com", role: "BDM", mobile: "9876543247", employeeCode: "BDM-003", status: "Active", region: "South", branch: "Bangalore Branch", joinDate: "2023-05-20", parentUserId: 11, createdBy: 11 },
  { id: 15, name: "Anil Bose", email: "anil.bdm@realestate.com", role: "BDM", mobile: "9876543248", employeeCode: "BDM-004", status: "Active", region: "East", branch: "Hyderabad Branch", joinDate: "2023-06-01", parentUserId: 12, createdBy: 12 },
  { id: 16, name: "Deepa Rao", email: "deepa.bdm@realestate.com", role: "BDM", mobile: "9876543249", employeeCode: "BDM-005", status: "Active", region: "South", branch: "Mumbai HQ", joinDate: "2023-06-05", parentUserId: 10, createdBy: 10 },
  { id: 6, name: "Anjali Verma", email: "sm@realestate.com", role: "Sales Manager", mobile: "9876543215", employeeCode: "SM-001", status: "Active", region: "North", branch: "Delhi HQ", joinDate: "2023-06-15", parentUserId: 5, createdBy: 5 },
  { id: 17, name: "Manoj Tiwari", email: "manoj.sm@realestate.com", role: "Sales Manager", mobile: "9876543250", employeeCode: "SM-002", status: "Active", region: "South", branch: "Mumbai HQ", joinDate: "2023-07-01", parentUserId: 13, createdBy: 13 },
  { id: 18, name: "Sonia Kapoor", email: "sonia.sm@realestate.com", role: "Sales Manager", mobile: "9876543251", employeeCode: "SM-003", status: "Active", region: "South", branch: "Bangalore Branch", joinDate: "2023-07-05", parentUserId: 14, createdBy: 14 },
  { id: 19, name: "Vijay Menon", email: "vijay.sm@realestate.com", role: "Sales Manager", mobile: "9876543252", employeeCode: "SM-004", status: "Active", region: "East", branch: "Hyderabad Branch", joinDate: "2023-07-10", parentUserId: 15, createdBy: 15 },
  { id: 20, name: "Rekha Das", email: "rekha.sm@realestate.com", role: "Sales Manager", mobile: "9876543253", employeeCode: "SM-005", status: "Active", region: "South", branch: "Mumbai HQ", joinDate: "2023-07-15", parentUserId: 16, createdBy: 16 },
  { id: 21, name: "Arjun Reddy", email: "arjun.sm@realestate.com", role: "Sales Manager", mobile: "9876543254", employeeCode: "SM-006", status: "Active", region: "South", branch: "Mumbai HQ", joinDate: "2023-07-20", parentUserId: 13, createdBy: 13 },
];

export function DataProvider({ children }) {
  const [sites, setSites] = useState(INITIAL_SITES);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [visits, setVisits] = useState(INITIAL_VISITS);
  const [users, setUsers] = useState(INITIAL_USERS);

  // Sites
  const addSite = (site) => setSites(prev => [...prev, { ...site, id: Date.now(), createdAt: new Date().toISOString().split("T")[0] }]);
  const updateSite = (id, updates) => setSites(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  const deleteSite = (id) => setSites(prev => prev.filter(s => s.id !== id));
  const approveSite = (id) => setSites(prev => prev.map(s => s.id === id ? { ...s, approved: true, status: "Active" } : s));

  // Customers
  const addCustomer = (customer) => {
    const newC = { ...customer, id: Date.now(), registeredDate: new Date().toISOString().split("T")[0] };
    setCustomers(prev => [...prev, newC]);
    const newV = { id: Date.now() + 1, customerId: newC.id, customerName: newC.name, siteId: newC.siteId, siteName: newC.siteName, visitDate: newC.visitDate, status: "Visit Scheduled", salesManagerId: newC.salesManagerId, notes: newC.notes || "" };
    setVisits(prev => [...prev, newV]);
    return newC;
  };
  const updateCustomer = (id, updates) => setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  const deleteCustomer = (id) => setCustomers(prev => prev.filter(c => c.id !== id));

  // Bookings
  const addBooking = (booking) => setBookings(prev => [...prev, { ...booking, id: Date.now(), bookingDate: new Date().toISOString().split("T")[0], invoiceNo: `INV-${Date.now()}` }]);
  const updateBooking = (id, updates) => setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));

  // Visits
  const updateVisit = (id, updates) => setVisits(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));

  // Users
  const addUser = (user, loggedInUserId) => setUsers(prev => [{
    ...user,
    id: Date.now() + Math.floor(Math.random() * 1000),
    joinDate: new Date().toISOString().split("T")[0],
    parentUserId: user.parentUserId ?? loggedInUserId,
    createdBy: user.createdBy ?? loggedInUserId,
  }, ...prev]);
  const updateUser = (id, updates) => setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u));
  const deleteUser = (id) => setUsers(prev => prev.filter(u => u.id !== id));

  // Commission rates
  const commissionRates = { Admin: 0, Director: 1.5, "Regional Manager": 1.0, "Branch Manager": 0.75, BDM: 0.5, "Sales Manager": 0.25 };

  return (
    <DataContext.Provider value={{
      sites, addSite, updateSite, deleteSite, approveSite,
      customers, addCustomer, updateCustomer, deleteCustomer,
      bookings, addBooking, updateBooking,
      visits, updateVisit,
      users, addUser, updateUser, deleteUser,
      commissionRates,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}