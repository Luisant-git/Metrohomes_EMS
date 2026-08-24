import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "./AuthContext.jsx";
import { user as userApi } from "../api/user.js";
import { site as siteApi } from "../api/site.js";
import { customer as customerApi } from "../api/customer.js";
import { booking as bookingApi } from "../api/booking.js";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [sites, setSites] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [visits, setVisits] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const { user } = useAuth();

  const refreshCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true);
      const data = await customerApi.getAll();
      const list = Array.isArray(data) ? data : (data.customers || data.data || []);
      
      const normalized = list.map((c) => {
        const row = {
          ...c,
          siteName: c.siteName || c.site?.name || "",
          salesManagerName: c.salesManagerName || c.user?.name || "",
          mobile: c.mobile || c.phone || "",
          registeredDate: c.registeredDate || (c.createdAt ? new Date(c.createdAt).toISOString().split('T')[0] : ''),
        };
        
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

  const refreshSites = useCallback(async () => {
    try {
      const data = await siteApi.getAll();
      const list = Array.isArray(data) ? data : (data.sites || data.data || []);
      setSites(list);
    } catch (err) {
      console.error("Failed to fetch sites:", err);
    }
  }, []);

  const refreshBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
      const data = await bookingApi.getAll();
      const list = Array.isArray(data) ? data : (data.bookings || data.data || []);
      const normalized = list.map((b) => ({
        ...b,
        siteName: b.siteName || (b.site?.siteNo ? `${b.project?.name || ''} - Site ${b.site.siteNo}` : b.project?.name || ""),
        customerName: b.customerName || b.customer?.name || "",
        creatorName: b.creatorName || b.creator?.name || "",
        creatorRole: b.creatorRole || b.creator?.role || "",
        creatorEmployeeCode: b.creatorEmployeeCode || b.creator?.employeeCode || "",
        createdUser: b.createdUser || b.creator || null,
        createdById: b.createdById || b.createdBy || b.creator?.id || null,
        salesManagerName: b.salesManagerName || b.assignedToUser?.name || b.creator?.name || "",
      }));
      setBookings(normalized);
    } catch (err) {
      console.error("Failed to fetch bookings:", err);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      // Run sequentially to prevent overwhelming the server on initial load
      const loadAllData = async () => {
        await refreshUsers();
        await refreshSites();
        await refreshBookings();
        await refreshCustomers();
      };
      loadAllData();
    }
  }, [user, refreshUsers, refreshSites, refreshBookings, refreshCustomers]);

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
      setCustomers(prev => prev.filter(c => c.id !== id));
      await refreshCustomers();
    } catch (err) {
      console.error("Failed to delete customer:", err);
      throw err;
    }
  };

  const addBooking = async (booking) => {
    await bookingApi.create(booking);
    await refreshBookings();
  };

  const updateBooking = async (id, updates) => {
    await bookingApi.update(id, updates);
    setBookings(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const updateVisit = (id, updates) => setVisits(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));

  const addUser = async (userData, loggedInUserId) => {
    try {
      const created = await userApi.create({
        ...userData,
        parentUserId: userData.parentUserId ?? loggedInUserId,
      });
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
      setUsers(prev => prev.filter(u => u.id !== id));
      await refreshUsers();
    } catch (err) {
      console.error("Failed to delete user:", err);
      throw err;
    }
  };

  const commissionRates = { Admin: 0, Director: 1.5, "Regional Manager": 1.0, "Branch Manager": 0.75, BDM: 0.5, "Sales Manager": 0.25 };

  return (
    <DataContext.Provider value={{
      sites, addSite, updateSite, deleteSite, approveSite,
      customers, addCustomer, updateCustomer, deleteCustomer, refreshCustomers,
      bookings, addBooking, updateBooking, refreshBookings, bookingsLoading,
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