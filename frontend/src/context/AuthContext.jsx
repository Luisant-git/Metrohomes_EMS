import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: "Admin",
  DIRECTOR: "Director",
  REGIONAL_MANAGER: "Regional Manager",
  BRANCH_MANAGER: "Branch Manager",
  BDM: "BDM",
  SALES_MANAGER: "Sales Manager",
};

export const WEB_ROLES = [ROLES.ADMIN, ROLES.DIRECTOR];
export const PWA_ROLES = [
  ROLES.REGIONAL_MANAGER,
  ROLES.BRANCH_MANAGER,
  ROLES.BDM,
  ROLES.SALES_MANAGER,
];

// Mock users
const MOCK_USERS = [
  { id: 1, name: "Arjun Mehta", email: "admin@realestate.com", password: "admin123", role: ROLES.ADMIN, mobile: "9876543210", avatar: null, status: "Active", region: null, branch: null },
  { id: 2, name: "Priya Sharma", email: "director@realestate.com", password: "dir123", role: ROLES.DIRECTOR, mobile: "9876543211", avatar: null, status: "Active", region: "North", branch: null },
  { id: 3, name: "Rajesh Kumar", email: "rm@realestate.com", password: "rm123", role: ROLES.REGIONAL_MANAGER, mobile: "9876543212", avatar: null, status: "Active", region: "North", branch: null },
  { id: 4, name: "Sunita Patel", email: "bm@realestate.com", password: "bm123", role: ROLES.BRANCH_MANAGER, mobile: "9876543213", avatar: null, status: "Active", region: "North", branch: "Delhi HQ" },
  { id: 5, name: "Vikram Singh", email: "bdm@realestate.com", password: "bdm123", role: ROLES.BDM, mobile: "9876543214", avatar: null, status: "Active", region: "North", branch: "Delhi HQ" },
  { id: 6, name: "Anjali Verma", email: "sm@realestate.com", password: "sm123", role: ROLES.SALES_MANAGER, mobile: "9876543215", avatar: null, status: "Active", region: "North", branch: "Delhi HQ" },
];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("re_user");
    if (saved) {
      try { setUser(JSON.parse(saved)); } catch {}
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const found = MOCK_USERS.find(u => u.email === email && u.password === password);
    if (found) {
      const { password: _, ...safeUser } = found;
      setUser(safeUser);
      localStorage.setItem("re_user", JSON.stringify(safeUser));
      return { success: true, user: safeUser };
    }
    return { success: false, error: "Invalid email or password" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("re_user");
  };

  const updateProfile = (updates) => {
    const updated = { ...user, ...updates };
    setUser(updated);
    localStorage.setItem("re_user", JSON.stringify(updated));
  };

  const isWebRole = user && WEB_ROLES.includes(user.role);
  const isPWARole = user && PWA_ROLES.includes(user.role);

  return (
    <AuthContext.Provider value={{ user, login, logout, updateProfile, loading, isWebRole, isPWARole, MOCK_USERS }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
