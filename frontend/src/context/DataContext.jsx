import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import { user as userApi } from "../api/user.js";
import { site as siteApi } from "../api/site.js";
import { customer as customerApi } from "../api/customer.js";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [sites, setSites] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [visits, setVisits] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const { user } = useAuth();

  // Fetch customers from API when user changes or on mount (if user exists)
  const refreshCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true);
      const data = await customerApi.getAll();
      const list = Array.isArray(data) ? data : (data.customers || data.data || []);
      
      // Normalize fields to match frontend expectations
      const normalized = list.map((c) => {
        const row = {
          ...c,
          siteName: c.siteName || c.site?.name || "",
          salesManagerName: c.salesManagerName || c.user?.name || "",
          mobile: c.mobile || c.phone || "",
          registeredDate: c.registeredDate || (c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : ''),
        };
        
        // Normalize dates from ISO to YYYY-MM-DD
        if (row.visitDate && row.visitDate.includes('T')) {
          row.visitDate = row.visitDate.split('T')[0];
        }
        if (row.registeredDate && row.registeredDate.includes('T')) {
          row.registeredDate = row.registeredDate.split('T')[0];
        }
        
        return row;
      });
      
      setCustomers(normalized);
    } catch (err) {
      console.error("Failed to fetch customers:", err);
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshCustomers();
    }
  }, [user, refreshCustomers]);

  // Fetch users from API when user changes or on mount
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
    if (user) {
      refreshUsers();
    }
  }, [user, refreshUsers]);

  // Fetch sites from API when user changes or on mount
  const refreshSites = useCallback(async () => {
    try {
      const data = await siteApi.getAll();
      setSites(Array.isArray(data) ? data : (data.sites || data.data || []));
    } catch (err) {
      console.error("Failed to fetch sites:", err);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshSites();
    }
  }, [user, refreshSites]);

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

  // Customers — API-backed
  const addCustomer = async (customer) => {
    try {
      await customerApi.registerCustomer(customer);
      await refreshCustomers();
    } catch (err) {
      console.error("Failed to create customer:", err);
      throw err;
    }
  };

  const updateCustomer = async (id, updates) => {
    try {
      await customerApi.update(id, updates);
      await refreshCustomers();
    } catch (err) {
      console.error("Failed to update customer:", err);
      throw err;
    }
  };

  const deleteCustomer = async (id) => {
    try {
      await customerApi.remove(id);
      await refreshCustomers();
    } catch (err) {
      console.error("Failed to delete customer:", err);
      throw err;
    }
  };

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