import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { user as userApi } from "../api/user.js";
import { site as siteApi } from "../api/site.js";

const DataContext = createContext(null);


const INITIAL_CUSTOMERS = [
  // Sales Manager: Anjali Verma (id: 6) - Delhi HQ
  { id: 1, name: "Ramesh Gupta", mobile: "9811234567", email: "ramesh@email.com", address: "Lajpat Nagar, Delhi", status: "Booked", siteId: 1, siteName: "Green Valley Residency", salesManagerId: 6, salesManagerName: "Anjali Verma", visitDate: "2024-04-10", registeredDate: "2024-04-05", notes: "Interested in corner plot" },
  { id: 2, name: "Meena Agarwal", mobile: "9822345678", email: "meena@email.com", address: "Rohini, Delhi", status: "Visit Completed", siteId: 1, siteName: "Green Valley Residency", salesManagerId: 6, salesManagerName: "Anjali Verma", visitDate: "2024-04-15", registeredDate: "2024-04-12", notes: "Wants 200 sq yard plot" },
  { id: 13, name: "Rajiv Kapoor", mobile: "9812345001", email: "rajiv@email.com", address: "Pitampura, Delhi", status: "Interested", siteId: 1, siteName: "Green Valley Residency", salesManagerId: 6, salesManagerName: "Anjali Verma", visitDate: "2024-06-10", registeredDate: "2024-06-05", notes: "Looking for 150 sq yard plot" },
  { id: 14, name: "Neha Singh", mobile: "9812345002", email: "neha@email.com", address: "Saket, Delhi", status: "Visit Scheduled", siteId: 3, siteName: "Blue Lagoon Villas", salesManagerId: 6, salesManagerName: "Anjali Verma", visitDate: "2024-06-20", registeredDate: "2024-06-15", notes: "Interested in 3 BHK villa" },
  { id: 15, name: "Amit Khanna", mobile: "9812345003", email: "amit@email.com", address: "Janakpuri, Delhi", status: "Ready for Booking", siteId: 1, siteName: "Green Valley Residency", salesManagerId: 6, salesManagerName: "Anjali Verma", visitDate: "2024-06-08", registeredDate: "2024-05-28", notes: "Finalizing plot selection" },

  // Sales Manager: Manoj Tiwari (id: 17) - Mumbai HQ
  { id: 16, name: "Priyanka Desai", mobile: "9812345004", email: "priyanka@email.com", address: "Andheri West, Mumbai", status: "Booked", siteId: 2, siteName: "Sunrise Commercial Hub", salesManagerId: 17, salesManagerName: "Manoj Tiwari", visitDate: "2024-05-20", registeredDate: "2024-05-10", notes: "Office space for IT firm" },
  { id: 17, name: "Siddharth Rao", mobile: "9812345005", email: "siddharth@email.com", address: "Bandra East, Mumbai", status: "Interested", siteId: 4, siteName: "Emerald Heights", salesManagerId: 17, salesManagerName: "Manoj Tiwari", visitDate: "2024-06-12", registeredDate: "2024-06-08", notes: "Premium plot for luxury home" },
  { id: 18, name: "Komal Shah", mobile: "9812345006", email: "komal@email.com", address: "Malad West, Mumbai", status: "Visit Completed", siteId: 2, siteName: "Sunrise Commercial Hub", salesManagerId: 17, salesManagerName: "Manoj Tiwari", visitDate: "2024-06-05", registeredDate: "2024-05-30", notes: "Needs 500 sq ft commercial space" },
  { id: 19, name: "Rohan Patil", mobile: "9812345007", email: "rohan@email.com", address: "Thane West, Mumbai", status: "Visit Scheduled", siteId: 4, siteName: "Emerald Heights", salesManagerId: 17, salesManagerName: "Manoj Tiwari", visitDate: "2024-06-25", registeredDate: "2024-06-18", notes: "First time buyer" },

  // Sales Manager: Sonia Kapoor (id: 18) - Bangalore Branch
  { id: 20, name: "Arun Kumar", mobile: "9812345008", email: "arun@email.com", address: "Whitefield, Bangalore", status: "Payment Done", siteId: 3, siteName: "Blue Lagoon Villas", salesManagerId: 18, salesManagerName: "Sonia Kapoor", visitDate: "2024-04-25", registeredDate: "2024-04-10", notes: "Villa booked, payment completed", paymentAmount: 12500000, invoiceNo: "INV-2024-002" },
  { id: 21, name: "Lakshmi Narayan", mobile: "9812345009", email: "lakshmi@email.com", address: "Indiranagar, Bangalore", status: "Booked", siteId: 3, siteName: "Blue Lagoon Villas", salesManagerId: 18, salesManagerName: "Sonia Kapoor", visitDate: "2024-05-15", registeredDate: "2024-05-01", notes: "Corner villa preferred" },
  { id: 22, name: "Venkatesh Iyer", mobile: "9812345010", email: "venky@email.com", address: "Koramangala, Bangalore", status: "Interested", siteId: 1, siteName: "Green Valley Residency", salesManagerId: 18, salesManagerName: "Sonia Kapoor", visitDate: "2024-06-18", registeredDate: "2024-06-12", notes: "Investment purpose" },
  { id: 23, name: "Divya Menon", mobile: "9812345011", email: "divya@email.com", address: "HSR Layout, Bangalore", status: "Visit Completed", siteId: 3, siteName: "Blue Lagoon Villas", salesManagerId: 18, salesManagerName: "Sonia Kapoor", visitDate: "2024-06-02", registeredDate: "2024-05-25", notes: "Liked the clubhouse amenities" },

  // Sales Manager: Vijay Menon (id: 19) - Hyderabad Branch
  { id: 24, name: "Srinivas Reddy", mobile: "9812345012", email: "srinivas@email.com", address: "Gachibowli, Hyderabad", status: "Booked", siteId: 4, siteName: "Emerald Heights", salesManagerId: 19, salesManagerName: "Vijay Menon", visitDate: "2024-05-05", registeredDate: "2024-04-20", notes: "Plot for construction" },
  { id: 25, name: "Padma Rao", mobile: "9812345013", email: "padma@email.com", address: "Jubilee Hills, Hyderabad", status: "Ready for Booking", siteId: 4, siteName: "Emerald Heights", salesManagerId: 19, salesManagerName: "Vijay Menon", visitDate: "2024-06-10", registeredDate: "2024-06-01", notes: "Want to book 2 plots" },
  { id: 26, name: "Mohan Krishna", mobile: "9812345014", email: "mohan@email.com", address: "Kukatpally, Hyderabad", status: "Interested", siteId: 2, siteName: "Sunrise Commercial Hub", salesManagerId: 19, salesManagerName: "Vijay Menon", visitDate: "2024-06-22", registeredDate: "2024-06-15", notes: "Looking for retail space" },
  { id: 27, name: "Sunitha Devi", mobile: "9812345015", email: "sunitha@email.com", address: "Madhapur, Hyderabad", status: "Visit Scheduled", siteId: 4, siteName: "Emerald Heights", salesManagerId: 19, salesManagerName: "Vijay Menon", visitDate: "2024-06-28", registeredDate: "2024-06-20", notes: "Budget around 80 lakhs" },

  // Sales Manager: Rekha Das (id: 20) - Mumbai HQ
  { id: 7, name: "Suresh Bhatia", mobile: "9833456789", email: "suresh@email.com", address: "Vasant Kunj, Delhi", status: "Interested", siteId: 2, siteName: "Sunrise Commercial Hub", salesManagerId: 20, salesManagerName: "Rekha Das", visitDate: "2024-04-20", registeredDate: "2024-04-18", notes: "Looking for office space" },
  { id: 28, name: "Farhan Ali", mobile: "9812345016", email: "farhan@email.com", address: "Colaba, Mumbai", status: "Visit Completed", siteId: 2, siteName: "Sunrise Commercial Hub", salesManagerId: 20, salesManagerName: "Rekha Das", visitDate: "2024-06-08", registeredDate: "2024-06-02", notes: "Wants ground floor office" },
  { id: 29, name: "Nisha Jain", mobile: "9812345017", email: "nisha@email.com", address: "Powai, Mumbai", status: "Booked", siteId: 4, siteName: "Emerald Heights", salesManagerId: 20, salesManagerName: "Rekha Das", visitDate: "2024-05-25", registeredDate: "2024-05-10", notes: "Plot for weekend home" },

  // Sales Manager: Arjun Reddy (id: 21) - Mumbai HQ
  { id: 8, name: "Kavita Joshi", mobile: "9844567890", email: "kavita@email.com", address: "Noida Sec 15", status: "Ready for Booking", siteId: 3, siteName: "Blue Lagoon Villas", salesManagerId: 21, salesManagerName: "Arjun Reddy", visitDate: "2024-04-08", registeredDate: "2024-04-01", notes: "Premium villa preferred" },
  { id: 30, name: "Prakash Sharma", mobile: "9812345018", email: "prakash@email.com", address: "Navi Mumbai", status: "Interested", siteId: 1, siteName: "Green Valley Residency", salesManagerId: 21, salesManagerName: "Arjun Reddy", visitDate: "2024-06-15", registeredDate: "2024-06-10", notes: "Retirement home" },
  { id: 31, name: "Shweta Pandey", mobile: "9812345019", email: "shweta@email.com", address: "Vashi, Navi Mumbai", status: "Visit Scheduled", siteId: 3, siteName: "Blue Lagoon Villas", salesManagerId: 21, salesManagerName: "Arjun Reddy", visitDate: "2024-06-30", registeredDate: "2024-06-22", notes: "Villa with garden required" },

  // Existing customers (reassigned to correct sales managers)
  { id: 9, name: "Deepak Nair", mobile: "9855678901", email: "deepak@email.com", address: "Sector 12, Gurgaon", status: "Dropped", siteId: 1, siteName: "Green Valley Residency", salesManagerId: 6, salesManagerName: "Anjali Verma", visitDate: "2024-03-25", registeredDate: "2024-03-20", notes: "Budget constraint" },
  { id: 10, name: "Pooja Mehrotra", mobile: "9866789012", email: "pooja@email.com", address: "Indirapuram, Ghaziabad", status: "Payment Done", siteId: 4, siteName: "Emerald Heights", salesManagerId: 6, salesManagerName: "Anjali Verma", visitDate: "2024-03-15", registeredDate: "2024-03-10", notes: "Plot no. 45 confirmed", paymentAmount: 7600000, invoiceNo: "INV-2024-001" },
  { id: 11, name: "Anita Sharma", mobile: "9876543299", email: "anita@email.com", address: "Dwarka, Delhi", status: "Booked", siteId: 2, siteName: "Sunrise Commercial Hub", salesManagerId: 6, salesManagerName: "Anjali Verma", visitDate: "2024-05-01", registeredDate: "2024-04-25", notes: "Commercial space for clinic" },
  { id: 12, name: "Vijay Malhotra", mobile: "9876543300", email: "vijay@email.com", address: "Noida Sector 62", status: "Visit Scheduled", siteId: 1, siteName: "Green Valley Residency", salesManagerId: 6, salesManagerName: "Anjali Verma", visitDate: "2024-05-10", registeredDate: "2024-05-05", notes: "Wants 2 plots side by side" },
];

const INITIAL_BOOKINGS = [
  { id: 1, customerId: 1, customerName: "Ramesh Gupta", siteId: 1, siteName: "Green Valley Residency", plotArea: 200, plotPrice: 11000000, paidAmount: 5000000, remainingAmount: 6000000, status: "Booked", salesManagerId: 6, salesManagerName: "Anjali Verma", bookingDate: "2026-04-12", invoiceNo: "INV-2026-001", projectNo: "PRJ-001", propertyType: "Plot" },
  { id: 2, customerId: 10, customerName: "Pooja Mehrotra", siteId: 4, siteName: "Emerald Heights", plotArea: 200, plotPrice: 7600000, paidAmount: 7600000, remainingAmount: 0, status: "Payment Done", salesManagerId: 23, salesManagerName: "Ajay Singh", bookingDate: "2026-03-18", invoiceNo: "INV-2026-002", projectNo: "PRJ-004", propertyType: "Plot" },
  { id: 3, customerId: 11, customerName: "Anita Sharma", siteId: 2, siteName: "Sunrise Commercial Hub", plotArea: 150, plotPrice: 18000000, paidAmount: 9000000, remainingAmount: 9000000, status: "Booked", salesManagerId: 24, salesManagerName: "Suresh Pal", bookingDate: "2026-05-02", invoiceNo: "INV-2026el-003", projectNo: "PRJ-002", propertyType: "Commercial" },
];

const INITIAL_VISITS = [
  { id: 1, customerId: 1, customerName: "Ramesh Gupta", siteId: 1, siteName: "Green Valley Residency", visitDate: "2024-04-10", status: "Visit Completed", salesManagerId: 6, notes: "Customer loved the location" },
  { id: 2, customerId: 2, customerName: "Meena Agarwal", siteId: 1, siteName: "Green Valley Residency", visitDate: "2024-04-15", status: "Visit Completed", salesManagerId: 6, notes: "Wants to bring family next time" },
  { id: 3, customerId: 7, customerName: "Suresh Bhatia", siteId: 2, siteName: "Sunrise Commercial Hub", visitDate: "2024-04-20", status: "Visit Scheduled", salesManagerId: 20, notes: "" },
  { id: 4, customerId: 8, customerName: "Kavita Joshi", siteId: 3, siteName: "Blue Lagoon Villas", visitDate: "2024-04-08", status: "Visit Completed", salesManagerId: 21, notes: "Very interested in villa" },
  { id: 5, customerId: 11, customerName: "Anita Sharma", siteId: 2, siteName: "Sunrise Commercial Hub", visitDate: "2024-05-01", status: "Visit Completed", salesManagerId: 24, notes: "Confirmed booking same day" },
  { id: 6, customerId: 12, customerName: "Vijay Malhotra", siteId: 1, siteName: "Green Valley Residency", visitDate: "2024-05-10", status: "Visit Scheduled", salesManagerId: 25, notes: "" },
];



export function DataProvider({ children }) {
  const [sites, setSites] = useState([]);
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [visits, setVisits] = useState(INITIAL_VISITS);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  // Fetch users from API on mount
  const refreshUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      const data = await userApi.getAll();
      setUsers(Array.isArray(data) ? data : (data.users || data.data || []));
    } catch (err) {
      console.error("Failed to fetch users:", err);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUsers();
  }, [refreshUsers]);

  // Fetch sites from API on mount
  const refreshSites = useCallback(async () => {
    try {
      const data = await siteApi.getAll();
      setSites(Array.isArray(data) ? data : (data.sites || data.data || []));
    } catch (err) {
      console.error("Failed to fetch sites:", err);
    }
  }, []);

  useEffect(() => {
    refreshSites();
  }, [refreshSites]);

  // Sites — API-backed
  const addSite = async (siteData) => {
    try {
      const created = await siteApi.create(siteData);
      await refreshSites();
      return created;
    } catch (err) {
      console.error("Failed to create site:", err);
      throw err;
    }
  };

  const updateSite = async (id, updates) => {
    try {
      await siteApi.update(id, updates);
      await refreshSites();
    } catch (err) {
      console.error("Failed to update site:", err);
      throw err;
    }
  };

  const deleteSite = async (id) => {
    try {
      await siteApi.delete(id);
      setSites(prev => prev.filter(s => s.id !== id));
      await refreshSites();
    } catch (err) {
      console.error("Failed to delete site:", err);
      throw err;
    }
  };

  const approveSite = async (id) => {
    try {
      await siteApi.update(id, { status: "Active" });
      await refreshSites();
    } catch (err) {
      console.error("Failed to approve site:", err);
      throw err;
    }
  };

  // Customers
  const addCustomer = (customer) => {
    const newC = { ...customer, id: Date.now(), registeredDate: new Date().toISOString().split("T")[0] };
    setCustomers(prev => [newC, ...prev]);
    const newV = { id: Date.now() + 1, customerId: newC.id, customerName: newC.name, siteId: newC.siteId, siteName: newC.siteName, visitDate: newC.visitDate, status: "Visit Scheduled", salesManagerId: newC.salesManagerId, notes: newC.notes || "" };
    setVisits(prev => [...prev, newV]);
    return newC;
  };
  const updateCustomer = (id, updates) => setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  const deleteCustomer = (id) => setCustomers(prev => prev.filter(c => c.id !== id));

  // Bookings
  const addBooking = (booking) => setBookings(prev => {
    const year = new Date().getFullYear();
    const count = prev.filter(b => b.invoiceNo?.startsWith(`INV-${year}`)).length + 1;
    const invoiceNo = `INV-${year}-${String(count).padStart(3, '0')}`;
    return [...prev, { ...booking, id: Date.now(), bookingDate: new Date().toISOString().split("T")[0], invoiceNo }];
  });
  const updateBooking = (id, updates) => setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));

  // Visits
  const updateVisit = (id, updates) => setVisits(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));

  // Users — API-backed
  const addUser = async (userData, loggedInUserId) => {
    try {
      const created = await userApi.create({
        ...userData,
        parentUserId: userData.parentUserId ?? loggedInUserId,
      });
      // Re-fetch to get the server-generated data (id, employeeCode, joinDate, etc.)
      await refreshUsers();
      return created;
    } catch (err) {
      console.error("Failed to create user:", err);
      throw err;
    }
  };

  const updateUser = async (id, updates) => {
    try {
      await userApi.update(id, updates);
      await refreshUsers();
    } catch (err) {
      console.error("Failed to update user:", err);
      throw err;
    }
  };

  const deleteUser = async (id) => {
    try {
      await userApi.delete(id);
      // Optimistic update + refresh
      setUsers(prev => prev.filter(u => u.id !== id));
      await refreshUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      throw err;
    }
  };

  // Commission rates
  const commissionRates = { Admin: 0, Director: 1.5, "Regional Manager": 1.0, "Branch Manager": 0.75, BDM: 0.5, "Sales Manager": 0.25 };

  return (
    <DataContext.Provider value={{
      sites, addSite, updateSite, deleteSite, approveSite,
      customers, addCustomer, updateCustomer, deleteCustomer,
      bookings, addBooking, updateBooking,
      visits, updateVisit,
      users, addUser, updateUser, deleteUser, refreshUsers, usersLoading,
      commissionRates,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  return useContext(DataContext);
}