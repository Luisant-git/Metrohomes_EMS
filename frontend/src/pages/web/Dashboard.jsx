import { useMemo } from "react";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import StatCard from "../../components/StatCard.jsx";
import TeamMembersCard from "../../components/TeamMembersCard.jsx";
import { Users, Building2, UserCheck, BookOpen, MapPin, Trophy } from "lucide-react";

export default function WebDashboard() {
  const { users, customers, sites, bookings } = useData();
  const { user, hierarchy } = useAuth();

  // Get all user IDs in this user's hierarchy (including downline)
  const teamUserIds = useMemo(() => {
    const isAdminOrDirector = ["Admin", "Director"].includes(user?.role);
    if (isAdminOrDirector) {
      // Admin/Director see everything - just return all user IDs
      return users.map(u => u.id);
    }
    const downline = hierarchy.getDownline(users);
    const teamMembers = [user, ...downline].filter(Boolean);
    return teamMembers.map(u => u.id);
  }, [users, user, hierarchy]);

  // Filter data to only show what belongs to this user's team (using createdById)
  const teamCustomers = useMemo(() => {
    return customers.filter(c => teamUserIds.includes(c.createdById));
  }, [customers, teamUserIds]);

  const teamBookings = useMemo(() => {
    return bookings.filter(b => teamUserIds.includes(b.createdById));
  }, [bookings, teamUserIds]);

  // Get team users with role breakdown (excluding current user for admin count)
  const teamInfo = useMemo(() => {
    const isAdminOrDirector = ["Admin", "Director"].includes(user?.role);
    let teamUsers = [];
    
    if (isAdminOrDirector) {
      // For Admin/Director, show all users but don't count themselves
      teamUsers = users.filter(u => u.id !== user?.id);
    } else {
      const downline = hierarchy.getDownline(users);
      teamUsers = downline.filter(Boolean);
    }

    // Count by roles - using short codes: D (Director), RM (Regional Manager), BM (Branch Manager), BDM, SM (Sales Manager)
    const roleCounts = {
      D: 0,
      RM: 0,
      BM: 0,
      BDM: 0,
      SM: 0,
    };

    teamUsers.forEach(u => {
      if (u.role === "Director") roleCounts.D++;
      else if (u.role === "Regional Manager") roleCounts.RM++;
      else if (u.role === "Branch Manager") roleCounts.BM++;
      else if (u.role === "BDM") roleCounts.BDM++;
      else if (u.role === "Sales Manager") roleCounts.SM++;
    });

    // Achievers: count of bookings
    const achievers = teamBookings.length;

    return {
      totalTeam: teamUsers.length,
      roleCounts,
      achievers,
    };
  }, [users, user, hierarchy, teamUserIds, bookings]);

  const activeSites = sites.filter(s => s.status === "Active").length;
  const totalBookings = teamBookings.length;
  const totalCustomers = teamCustomers.length;
  const totalSiteVisit = teamCustomers.filter(c => c.status !== "Interested").length;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-400 text-sm mt-0.5">
          Welcome back, {user?.name} ({user?.role}) · {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {!["Admin", "Director"].includes(user?.role) && (
            <span className="ml-2 text-blue-500 font-medium">· Team: {teamInfo.totalTeam} members</span>
          )}
        </p>
      </div>

      {/* Stats - Row 1: 4 stat cards */}
      <div className="grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4 min-w-0 w-full">
        <StatCard icon={BookOpen} label="Total Booking" value={totalBookings} color="blue" />
        <StatCard icon={UserCheck} label="Total Customers" value={totalCustomers} color="purple" />
        <StatCard icon={MapPin} label="Total Site Visit" value={totalSiteVisit} color="orange" />
        <StatCard icon={Building2} label="Active Sites" value={activeSites} color="green" />
      </div>

      {/* Stats - Row 2: Team Members full width */}
      <div className="grid grid-cols-1 gap-4">
        <TeamMembersCard totalTeam={teamInfo.totalTeam} roleCounts={teamInfo.roleCounts} />
      </div>

      {/* Stats - Row 3: Achievers */}
      <div className="grid grid-cols-1 gap-4">
        <StatCard icon={Trophy} label="No of Achievers" value={teamInfo.achievers} color="yellow" />
      </div>
    </div>
  );
}