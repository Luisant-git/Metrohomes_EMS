import { useState, useMemo } from "react";
import { useData } from "../../context/DataContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import StatCard from "../../components/StatCard.jsx";
import {
  Edit2, Trash2, Eye, Users, ChevronDown, ChevronRight, UserPlus,
  Search, Filter, Building2, Users as UsersIcon, UserCheck, TrendingUp,
  X, ChevronsDown, Shield, Crown, Globe, Briefcase, Target, CheckCircle, AlertCircle,
  User, Mail, Phone, MapPin, Calendar, CreditCard, Building, Hash, ArrowRight, Loader2,
  UserCog, UserCheck as UserVerify, FileText, Banknote, Users as UsersGroup
} from "lucide-react";
import toast from "react-hot-toast";

const REGIONS = ["North", "South", "East", "West", "Central", "Head Office"];
const BRANCHES = ["Delhi HQ", "Mumbai HQ", "Bangalore Branch", "Hyderabad Branch", "Chennai Branch", "Noida Branch", "Gurgaon Branch"];

const emptyForm = { 
  name: "", 
  email: "", 
  mobile: "", 
  role: "Sales Manager", 
  password: "",
  fatherHusbandName: "",
  address: "",
  dob: "",
  nomineeName: "",
  nomineeRelationship: "",
  bankName: "",
  bankAccountNo: "",
  ifscCode: "",
  bankBranch: "",
  panNo: "",
  referredById: "",
  referredByName: "",
  parentUserId: ""
};

function FormField({ label, children, span, required }) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <label className="label">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

// ─── Simple Success Modal Component ──────────────────────────────────────

function SuccessModal({ isOpen, onClose, userData }) {
  if (!isOpen || !userData) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full">
        {/* Header with Close Button */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">User Created</h3>
                <p className="text-sm text-gray-500">Account created successfully</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-4 space-y-3">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="text-xs text-gray-500">User ID</p>
            <p className="text-lg font-bold text-gray-900 font-mono">{userData.employeeCode}</p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium text-gray-900">{userData.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Role</span>
              <StatusBadge status={userData.role} />
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm text-gray-900">{userData.email || '—'}</span>
            </div>
            {userData.referredByName && userData.referredByName !== "User not found" && (
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-sm text-gray-500">Referred By</span>
                <span className="text-sm font-medium text-gray-900">
                  {userData.referredByName}
                  <span className="text-xs text-gray-400 ml-1">({userData.referredById})</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
          <button 
            onClick={onClose} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
// ─── Professional Add User Modal Component ────────────────────────────────

function AddUserModal({ 
  isOpen, 
  onClose, 
  form, 
  setForm, 
  handleSave, 
  createdUser, 
  creatableRoles, 
  users, 
  fetchReferredByName,
  currentUserRole,
  roleLevels
}) {
  const [verifiedManager, setVerifiedManager] = useState(null);
  const [verificationError, setVerificationError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  const roleLevelMap = roleLevels || {
    "Admin": 0,
    "Director": 1,
    "Regional Manager": 2,
    "Branch Manager": 3,
    "BDM": 4,
    "Sales Manager": 5,
  };

  const handleVerifyEmployee = () => {
    const userId = form.referredById?.trim();
    
    if (!userId) {
      setVerificationError("Please enter a User ID");
      setIsVerified(false);
      setVerifiedManager(null);
      return;
    }

    setIsVerifying(true);
    setVerificationError("");
    setIsVerified(false);
    setVerifiedManager(null);

    // Find the user by user id or employeeCode
    const foundUser = users.find(u => 
      u.employeeCode?.toLowerCase() === userId.toLowerCase() || 
      u.id === userId
    );

    setTimeout(() => {
      if (!foundUser) {
        setVerificationError("❌ User not found. Please check the User ID.");
        setIsVerified(false);
        setVerifiedManager(null);
        setIsVerifying(false);
        return;
      }

      // Check if user is active
      if (foundUser.status !== "Active") {
        setVerificationError("❌ This user is not active. Please contact HR.");
        setIsVerified(false);
        setVerifiedManager(null);
        setIsVerifying(false);
        return;
      }

      const currentRoleLevel = roleLevelMap[currentUserRole];
      const selectedRoleLevel = roleLevelMap[form.role];
      const managerRoleLevel = roleLevelMap[foundUser.role];

      if (currentRoleLevel === undefined || selectedRoleLevel === undefined) {
        setVerificationError("❌ Invalid role selected.");
        setIsVerified(false);
        setVerifiedManager(null);
        setIsVerifying(false);
        return;
      }

      if (selectedRoleLevel <= currentRoleLevel) {
        setVerificationError(`❌ ${currentUserRole} cannot create ${form.role} role.`);
        setIsVerified(false);
        setVerifiedManager(null);
        setIsVerifying(false);
        return;
      }

      if (managerRoleLevel === undefined || selectedRoleLevel <= managerRoleLevel) {
        setVerificationError(`❌ ${foundUser.role} cannot create ${form.role} role.`);
        setIsVerified(false);
        setVerifiedManager(null);
        setIsVerifying(false);
        return;
      }

      setVerifiedManager(foundUser);
      setIsVerified(true);
      setVerificationError("");
      setForm(p => ({ 
        ...p, 
        referredByName: foundUser.name,
        parentUserId: foundUser.id 
      }));
      toast.success(`✅ User verified successfully. ${form.role} will report to ${foundUser.name}.`);
      setIsVerifying(false);
    }, 500);
  };

  // Reset verification when role changes
  const handleRoleChange = (newRole) => {
    setForm(p => ({ ...p, role: newRole }));
    setIsVerified(false);
    setVerifiedManager(null);
    setVerificationError("");
    setForm(p => ({ ...p, referredById: "", referredByName: "", parentUserId: "" }));
  };

  // Reset verification when employee ID changes
  const handleEmployeeIdChange = (value) => {
    setForm(p => ({ ...p, referredById: value }));
    setIsVerified(false);
    setVerifiedManager(null);
    setVerificationError("");
  };

  if (!isOpen) return null;

  if (createdUser) {
    return <SuccessModal isOpen={true} onClose={onClose} userData={createdUser} />;
  }

  return (
    <Modal open={isOpen} onClose={onClose} title="Create New User" size="lg">
      <div className="space-y-5">
        {/* Step 1: Select Role */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shadow-sm">
              <UserCog size={16} className="text-white" />
            </div>
            <h4 className="text-sm font-bold text-gray-700">Select Designation</h4>
            <span className="text-xs text-gray-400 ml-auto">Step 1 of 3</span>
          </div>
          <FormField label="Designation" required>
            <select
              value={form.role}
              onChange={e => handleRoleChange(e.target.value)}
              className="input-field"
            >
              {creatableRoles.map(r => <option key={r}>{r}</option>)}
            </select>
          </FormField>
        </div>

        {/* Step 2: Verify Reporting Manager */}
        <div className={`border rounded-xl p-4 transition-all ${
          isVerified 
            ? 'border-green-500 bg-green-50' 
            : verificationError 
            ? 'border-red-500 bg-red-50'
            : 'border-gray-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shadow-sm ${
              isVerified 
                ? 'bg-green-600' 
                : verificationError 
                ? 'bg-red-600'
                : 'bg-purple-600'
            }`}>
              {isVerified ? (
                <CheckCircle size={16} className="text-white" />
              ) : verificationError ? (
                <AlertCircle size={16} className="text-white" />
              ) : (
                <UserVerify size={16} className="text-white" />
              )}
            </div>
            <h4 className={`text-sm font-bold ${
              isVerified 
                ? 'text-green-700' 
                : verificationError 
                ? 'text-red-700'
                : 'text-gray-700'
            }`}>
              Verify Referred User
            </h4>
            {isVerified && (
              <span className="text-xs text-green-600 ml-auto flex items-center gap-1">
                <CheckCircle size={14} />
                Verified ✓
              </span>
            )}
            {!isVerified && !verificationError && (
              <span className="text-xs text-gray-400 ml-auto">Step 2 of 3</span>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <FormField label="Referred User ID" required>
                <input
                  value={form.referredById}
                  onChange={e => handleEmployeeIdChange(e.target.value)}
                  className={`input-field ${
                    isVerified 
                      ? 'border-green-300 bg-green-50' 
                      : verificationError 
                      ? 'border-red-300 bg-red-50'
                      : ''
                  }`}
                  placeholder="Enter User ID (e.g., RM001)"
                  autoComplete="off"
                  disabled={isVerified}
                />
              </FormField>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleVerifyEmployee}
                disabled={isVerifying || !form.referredById || isVerified}
                className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap ${
                  isVerified
                    ? 'bg-green-600 text-white cursor-not-allowed shadow-lg shadow-green-200'
                    : isVerifying || !form.referredById
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-200'
                }`}
              >
                {isVerifying ? (
                  <span className="flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" />
                    Verifying...
                  </span>
                ) : isVerified ? (
                  <span className="flex items-center gap-2">
                    <CheckCircle size={16} />
                    Verified
                  </span>
                ) : (
                  'Verify'
                )}
              </button>
            </div>
          </div>

          {/* Verification Messages */}
          {verificationError && (
            <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="text-sm text-red-700">{verificationError.replace("Employee", "User")}</span>
              </div>
            </div>
          )}

          {/* Verified Manager Card */}
          {isVerified && verifiedManager && (
            <div className="mt-3 border-2 border-green-200 rounded-xl overflow-hidden bg-white shadow-lg shadow-green-100">
              <div className="bg-green-50 px-4 py-2 border-b border-green-200 flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  Reporting Manager Verified ✓
                </span>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                      {verifiedManager.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-medium">Name</p>
                      <p className="font-semibold text-gray-900 text-sm">{verifiedManager.name}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">User ID</p>
                    <p className="font-mono font-semibold text-gray-900 text-sm">{verifiedManager.employeeCode}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Role</p>
                    <StatusBadge status={verifiedManager.role} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-medium">Mobile</p>
                    <p className="font-semibold text-gray-900 text-sm flex items-center gap-1">
                      <Phone size={12} className="text-gray-400" />
                      {verifiedManager.mobile}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Step 3: User Details */}
        <div className="border border-gray-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-amber-600 flex items-center justify-center shadow-sm">
              <UsersGroup size={16} className="text-white" />
            </div>
            <h4 className="text-sm font-bold text-gray-700">User Details</h4>
            <span className="text-xs text-gray-400 ml-auto">Step 3 of 3</span>
          </div>

          {/* Personal Information */}
          <div className="border border-gray-100 rounded-lg p-4 mb-3">
            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <User size={14} className="text-blue-600" />
              Personal Information
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Full Name" required>
                <input
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="input-field"
                  placeholder="Enter full name"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Father's/Husband">
                <input
                  value={form.fatherHusbandName}
                  onChange={e => setForm(p => ({ ...p, fatherHusbandName: e.target.value }))}
                  className="input-field"
                  placeholder="Enter father's name"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Email" required>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input-field"
                  placeholder="email@company.com"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Mobile" required>
                <input
                  value={form.mobile}
                  onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                  className="input-field"
                  placeholder="Enter 10-digit mobile"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Date of Birth">
                <input
                  type="date"
                  value={form.dob}
                  onChange={e => setForm(p => ({ ...p, dob: e.target.value }))}
                  className="input-field"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Password" required>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  className="input-field"
                  placeholder="Set password"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Address" span>
                <textarea
                  value={form.address}
                  onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  className="input-field h-16 resize-none"
                  placeholder="Enter full address"
                  autoComplete="off"
                />
              </FormField>
            </div>
          </div>

          {/* Nominee Information */}
          <div className="border border-gray-100 rounded-lg p-4 mb-3">
            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <UsersGroup size={14} className="text-purple-600" />
              Nominee Information
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Nominee Name">
                <input
                  value={form.nomineeName}
                  onChange={e => setForm(p => ({ ...p, nomineeName: e.target.value }))}
                  className="input-field"
                  placeholder="Enter nominee name"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Relationship">
                <input
                  value={form.nomineeRelationship}
                  onChange={e => setForm(p => ({ ...p, nomineeRelationship: e.target.value }))}
                  className="input-field"
                  placeholder="e.g., Spouse, Son"
                  autoComplete="off"
                />
              </FormField>
            </div>
          </div>

          {/* Bank Information */}
          <div className="border border-gray-100 rounded-lg p-4">
            <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Banknote size={14} className="text-green-600" />
              Bank Information
            </h5>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Bank Name">
                <input
                  value={form.bankName}
                  onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))}
                  className="input-field"
                  placeholder="Enter bank name"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Account No">
                <input
                  value={form.bankAccountNo}
                  onChange={e => setForm(p => ({ ...p, bankAccountNo: e.target.value }))}
                  className="input-field"
                  placeholder="Enter account number"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="IFSC Code">
                <input
                  value={form.ifscCode}
                  onChange={e => setForm(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))}
                  className="input-field uppercase"
                  placeholder="Enter IFSC code"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="Branch">
                <input
                  value={form.bankBranch}
                  onChange={e => setForm(p => ({ ...p, bankBranch: e.target.value }))}
                  className="input-field"
                  placeholder="Enter branch name"
                  autoComplete="off"
                />
              </FormField>
              <FormField label="PAN No" required>
                <input
                  value={form.panNo}
                  onChange={e => setForm(p => ({ ...p, panNo: e.target.value.toUpperCase() }))}
                  className="input-field uppercase"
                  placeholder="Enter PAN number"
                  autoComplete="off"
                />
              </FormField>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <button 
            onClick={handleSave} 
            disabled={!isVerified}
            className={`flex-1 justify-center py-2.5 text-sm font-semibold rounded-lg transition-all ${
              isVerified 
                ? 'btn-primary shadow-lg shadow-blue-200' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isVerified ? `Create ${form.role}` : 'Verify Reporting Manager First'}
          </button>
          <button 
            onClick={onClose} 
            className="flex-1 btn-secondary justify-center py-2.5"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Node Stats Badge ────────────────────────────────────────────────────────
function NodeStat({ icon: Icon, label, value, color = "blue" }) {
  const colorMap = { 
    blue: "bg-blue-50 text-blue-700", 
    green: "bg-green-50 text-green-700", 
    purple: "bg-purple-50 text-purple-700", 
    orange: "bg-orange-50 text-orange-700" 
  };
  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorMap[color]}`}>
      <Icon size={10} />
      <span>{value}</span>
    </div>
  );
}

// ─── Hierarchy TreeNode Component ────────────────────────────────────────────
function TreeNode({ node, users, customers, bookings, depth = 0, onViewTeam }) {
  const [expanded, setExpanded] = useState(true);
  const children = users.filter(u => u.parentUserId === node.id);
  const downline = [];

  // Calculate downline
  const queue = [...children];
  while (queue.length > 0) {
    const c = queue.shift();
    downline.push(c);
    queue.push(...users.filter(u => u.parentUserId === c.id));
  }

  // Get all sales manager IDs in this user's downline (for counting customers/bookings)
  const allSmIds = [];
  const smQueue = [...downline];
  while (smQueue.length > 0) {
    const u = smQueue.shift();
    if (u.role === "Sales Manager") allSmIds.push(u.id);
    smQueue.push(...users.filter(x => x.parentUserId === u.id));
  }

  const activeCustomers = customers.filter(c => allSmIds.includes(c.salesManagerId)).length;
  const totalSales = bookings
    .filter(b => allSmIds.includes(b.salesManagerId))
    .reduce((sum, b) => sum + (b.paidAmount || 0), 0);

  const teamCount = children.length;
  const totalDownline = downline.length;

  return (
    <div>
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group border border-transparent hover:border-gray-100"
        style={{ paddingLeft: `${depth * 28 + 12}px` }}
        onClick={() => children.length > 0 && setExpanded(p => !p)}
      >
        {/* Expand/Collapse */}
        {children.length > 0 ? (
          <span className="text-gray-400 flex-shrink-0 transition-transform duration-200">
            {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </span>
        ) : (
          <span className="w-[14px] flex-shrink-0" />
        )}

        {/* Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm">
          {node.name?.charAt(0)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-800 truncate">{node.name}</span>
            <StatusBadge status={node.role} />
            <span className="text-[10px] text-gray-400 font-mono">{node.employeeCode}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-gray-400">
            {node.email && <span>{node.email}</span>}
            {node.mobile && <span>· {node.mobile}</span>}
            {node.branch && <span>· {node.branch}</span>}
            {node.region && <span>· {node.region}</span>}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-1.5 flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
          {teamCount > 0 && <NodeStat icon={UsersIcon} label="Direct" value={teamCount} color="blue" />}
          {totalDownline > 0 && <NodeStat icon={ChevronsDown} label="Team" value={totalDownline} color="purple" />}
          {activeCustomers > 0 && <NodeStat icon={UserCheck} label="Customers" value={activeCustomers} color="green" />}
          {totalSales > 0 && <NodeStat icon={TrendingUp} label="Sales" value={`₹${(totalSales / 100000).toFixed(0)}L`} color="orange" />}
        </div>

        {/* View Team button */}
        {children.length > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onViewTeam && onViewTeam(node); }}
            className="text-[10px] font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg transition-colors flex-shrink-0"
            title={`View ${node.name}'s team`}
          >
            Team
          </button>
        )}
      </div>

      {/* Children */}
      {expanded && children.length > 0 && (
        <div>
          {children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              users={users}
              customers={customers}
              bookings={bookings}
              depth={depth + 1}
              onViewTeam={onViewTeam}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function UserManagement() {
  const { users, customers, bookings, addUser, updateUser, deleteUser } = useData();
  const { user, hierarchy } = useAuth();
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [showTree, setShowTree] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);
  const [treeSearch, setTreeSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [viewingTeamId, setViewingTeamId] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const creatableRoles = useMemo(() => hierarchy.getCreatableRoles(), [hierarchy]);
  
  // Check if current user can create users (Only Admin and Director)
  const canCreateUser = useMemo(() => {
    return ["Admin", "Director"].includes(user?.role);
  }, [user]);

  // Get team members for a specific user
  const getTeamMembers = (userId) => {
    const teamMembers = [];
    const queue = [userId];
    const visited = new Set();
    
    while (queue.length > 0) {
      const currentId = queue.shift();
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      
      const children = users.filter(u => u.parentUserId === currentId);
      teamMembers.push(...children.map(u => u.id));
      queue.push(...children.map(u => u.id));
    }
    
    return teamMembers;
  };

  // Visible users to logged-in user
  const visibleUsers = useMemo(() => {
    const isAdminOrDirector = ["Admin", "Director"].includes(user?.role);
    if (isAdminOrDirector) return users;
    const myTeam = hierarchy.getDownline(users);
    const myself = users.find(u => u.id === user?.id);
    return myself ? [myself, ...myTeam] : myTeam;
  }, [users, user, hierarchy]);

  // Filtered users based on search/filter/team view
  const filteredUsers = useMemo(() => {
    let result = visibleUsers;
    
    if (viewingTeamId) {
      const teamMemberIds = getTeamMembers(viewingTeamId);
      result = result.filter(u => u.id === viewingTeamId || teamMemberIds.includes(u.id));
    }
    
    if (treeSearch) {
      const s = treeSearch.toLowerCase();
      result = result.filter(u =>
        u.name?.toLowerCase().includes(s) ||
        u.employeeCode?.toLowerCase().includes(s) ||
        u.mobile?.includes(s) ||
        u.email?.toLowerCase().includes(s) ||
        u.role?.toLowerCase().includes(s) ||
        u.branch?.toLowerCase().includes(s) ||
        u.region?.toLowerCase().includes(s)
      );
    }
    if (filterRole) {
      result = result.filter(u => u.role === filterRole);
    }
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      result = result.filter(u => {
        if (!u.joinDate) return false;
        const userDate = new Date(u.joinDate);
        return userDate >= fromDate;
      });
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      result = result.filter(u => {
        if (!u.joinDate) return false;
        const userDate = new Date(u.joinDate);
        return userDate <= toDate;
      });
    }
    return result;
  }, [visibleUsers, treeSearch, filterRole, dateFrom, dateTo, viewingTeamId, users]);

  // Tree roots
  const treeRoots = useMemo(() => {
    return users.filter(u => !u.parentUserId).sort((a, b) => {
      const order = ["Admin", "Director", "Regional Manager", "Branch Manager", "BDM", "Sales Manager"];
      return order.indexOf(a.role) - order.indexOf(b.role);
    });
  }, [users]);

  const openAdd = () => {
    setForm({
      ...emptyForm,
      role: creatableRoles[0] || "Sales Manager",
    });
    setCreatedUser(null);
    setShowSuccessModal(false);
    setModal("add");
  };

  // Fetch referred by user name
  const fetchReferredByName = (userId) => {
    if (!userId) {
      setForm(p => ({ ...p, referredByName: "" }));
      return;
    }
    const referredUser = users.find(u => u.employeeCode === userId || u.id === userId);
    if (referredUser) {
      setForm(p => ({ ...p, referredByName: referredUser.name, referredById: referredUser.id }));
    } else {
      setForm(p => ({ ...p, referredByName: "User not found", referredById: "" }));
    }
  };

  const openEdit = (u) => {
    setSelected(u);
    setForm({ ...u });
    setModal("edit");
  };

  const openView = (u) => {
    setSelected(u);
    setModal("view");
  };

  const roleCode = (role) => ({
    "Admin": "AD",
    "Director": "D",
    "Regional Manager": "RM",
    "Branch Manager": "BM",
    "BDM": "BD",
    "Sales Manager": "SM",
  }[role] || "EMP");

  const handleSave = () => {
    if (!form.name || !form.mobile) {
      toast.error("Full Name and Mobile are required");
      return;
    }
    if (!form.panNo) {
      toast.error("PAN No is required");
      return;
    }
    if (modal === "add") {
      const code = roleCode(form.role);
      const existingCount = users.filter(u => u.role === form.role).length;
      const employeeCode = `${code}${String(existingCount + 1).padStart(3, "0")}`;
      const userId = `${form.name.split(' ')[0].toLowerCase()}${Date.now().toString().slice(-4)}`;
      
      const userData = {
        ...form,
        parentUserId: form.parentUserId || user?.id,
        createdBy: user?.id,
        employeeCode,
        userId,
        status: "Active"
      };
      
      delete userData.referredById;
      delete userData.referredByName;
      
      addUser(userData, user?.id);
      
      const userDataWithReferred = { ...userData };
      setCreatedUser({
        ...userDataWithReferred,
        userId,
        employeeCode,
        password: form.password || 'Not set',
        referredByName: form.referredByName,
        referredById: form.referredById
      });
      
      setShowSuccessModal(true);
      toast.success(`${form.role} created successfully!`);
      setModal(null);
    } else {
      updateUser(selected.id, form);
      toast.success("User updated!");
      setModal(null);
    }
  };

  const handleDelete = (u) => {
    const hasChildren = users.some(child => child.parentUserId === u.id);
    const msg = hasChildren
      ? `Delete ${u.name}? This user has ${users.filter(c => c.parentUserId === u.id).length} team member(s) reporting to them. They will become orphaned.`
      : `Delete ${u.name}?`;
    if (window.confirm(msg)) {
      deleteUser(u.id);
      toast.success("User deleted");
    }
  };

  const columns = [
    { key: "employeeCode", label: "User ID", render: v => <span className="font-mono text-xs text-gray-500">{v || "—"}</span> },
    {
      key: "name", label: "Name", render: (v, row) => (
        <div>
          <div className="font-semibold text-gray-800">{v}</div>
          <div className="text-xs text-gray-400">{row.email}</div>
        </div>
      )
    },
    { key: "role", label: "Designation", render: v => <StatusBadge status={v} /> },
    { key: "mobile", label: "Mobile" },
    {
      key: "parentUserId", label: "Referred By", render: (v) => {
        const parent = users.find(u => u.id === v);
        return parent ? (
          <span className="text-sm text-gray-600">{parent.name}</span>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        );
      }
    },
    { key: "status", label: "Status", render: v => <StatusBadge status={v} /> },
  ];

  // View specific team
  const handleViewTeam = (node) => {
    setViewingTeamId(node.id);
    setShowTree(false);
    toast.success(`Showing ${node.name}'s team`, { duration: 2000 });
  };

  // Clear team filter
  const clearTeamFilter = () => {
    setViewingTeamId(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users size={22} /> User Management
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {viewingTeamId && (
            <button onClick={clearTeamFilter} className="btn-secondary text-sm">
              <X size={14} /> Clear Filter
            </button>
          )}
          <button
            onClick={() => setShowTree(p => !p)}
            className={`${showTree ? "btn-primary" : "btn-secondary"} text-sm`}
          >
            {showTree ? <Users size={14} /> : <Users size={14} />} {showTree ? "Tree View" : "Table View"}
          </button>
          
        </div>
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { role: "Admin", icon: Shield, color: "indigo" },
          { role: "Director", icon: Crown, color: "blue" },
          { role: "Regional Manager", icon: Globe, color: "purple" },
          { role: "Branch Manager", icon: Building2, color: "cyan" },
          { role: "BDM", icon: Briefcase, color: "orange" },
          { role: "Sales Manager", icon: Target, color: "green" },
        ].map(({ role, icon: Icon, color }) => {
          const count = visibleUsers.filter(u => u.role === role).length;
          const isActive = filterRole === role;
          const activeStyles = {
            indigo: "bg-indigo-50 border border-indigo-200 shadow-lg shadow-indigo-100/40",
            blue: "bg-blue-50 border border-blue-200 shadow-lg shadow-blue-100/40",
            purple: "bg-purple-50 border border-purple-200 shadow-lg shadow-purple-100/40",
            cyan: "bg-cyan-50 border border-cyan-200 shadow-lg shadow-cyan-100/40",
            orange: "bg-orange-50 border border-orange-200 shadow-lg shadow-orange-100/40",
            green: "bg-green-50 border border-green-200 shadow-lg shadow-green-100/40",
          };
          const iconWrapperClasses = {
            indigo: "bg-indigo-50 ring-1 ring-indigo-100",
            blue: "bg-blue-50 ring-1 ring-blue-100",
            purple: "bg-purple-50 ring-1 ring-purple-100",
            cyan: "bg-cyan-50 ring-1 ring-cyan-100",
            orange: "bg-orange-50 ring-1 ring-orange-100",
            green: "bg-green-50 ring-1 ring-green-100",
          };
          const colorTextClasses = {
            indigo: "text-indigo-600",
            blue: "text-blue-600",
            purple: "text-purple-600",
            cyan: "text-cyan-600",
            orange: "text-orange-600",
            green: "text-green-600",
          };
          return (
            <div key={role} onClick={() => setFilterRole(prev => prev === role ? "" : role)} className="min-w-[180px]">
              <div className={`card p-5 transition-all duration-200 ${isActive ? activeStyles[color] : "bg-white hover:shadow-md"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 rounded-2xl ${iconWrapperClasses[color]} flex items-center justify-center`}>
                    <Icon size={22} className={colorTextClasses[color]} />
                  </div>
                </div>
                <div className="text-2xl font-extrabold text-gray-900 tabular-nums mb-0.5">
                  {count}
                </div>
                <div className={`${isActive ? `font-bold ${colorTextClasses[color]}` : "font-medium text-gray-500"} text-xs`}>
                  {role}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Reporting info card */}
      <div className="card p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-sm">
          {user?.name?.charAt(0)}
        </div>
        <div className="flex-1">
          <div className="text-sm font-bold text-gray-800">
            {user?.name} · <StatusBadge status={user?.role} /> · <span className="font-mono text-gray-500 font-normal">{user?.employeeCode}</span>
          </div>
          <div className="text-xs text-gray-400 mt-0.5">
            {user?.parentUserId ? (
              (() => {
                const manager = users.find(u => u.id === user.parentUserId);
                return manager ? (
                  <>Reports to: <span className="font-medium text-gray-600">{manager.name} ({manager.role})</span></>
                ) : null;
              })()
            ) : (
              <>Top-level user · Full organization access</>
            )}
           
          </div>
        </div>
      </div>

      {/* Team filter indicator */}
      {viewingTeamId && !showTree && (
        <div className="flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-semibold px-4 py-2.5 rounded-xl">
          <Users size={16} />
          <span>Viewing Team: {users.find(u => u.id === viewingTeamId)?.name}</span>
          <button onClick={clearTeamFilter} className="ml-auto hover:text-blue-900">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search & Filter Bar (for tree view) */}
      {showTree && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={treeSearch}
              onChange={e => setTreeSearch(e.target.value)}
              placeholder="Search by Name, Code, Mobile, Role, Branch, Region..."
              className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {treeSearch && (
              <button onClick={() => setTreeSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <X size={14} />
              </button>
            )}
          </div>
          {viewingTeamId && (
            <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-2 rounded-xl">
              <Users size={12} />
              Team View
              <button onClick={clearTeamFilter} className="ml-1 hover:text-indigo-900"><X size={12} /></button>
            </div>
          )}
          {filterRole && !viewingTeamId && (
            <div className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-2 rounded-xl">
              <Filter size={12} />
              {filterRole}
              <button onClick={() => setFilterRole("")} className="ml-1 hover:text-blue-900"><X size={12} /></button>
            </div>
          )}
          <div className="text-xs text-gray-400">
            {filteredUsers.length} of {visibleUsers.length} shown
          </div>
        </div>
      )}

      {/* Tree View */}
      {showTree ? (
        <div className="card p-5">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Building2 size={16} /> Organization Hierarchy
            <span className="text-xs font-normal text-gray-400 ml-1">
              ({users.length} total · {treeRoots.length} top-level)
            </span>
          </h3>

          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {treeSearch ? "No users match your search" : "No users in your hierarchy"}
            </div>
          ) : (
            <div className="space-y-1">
              {treeRoots.map(root => (
                <TreeNode
                  key={root.id}
                  node={root}
                  users={users}
                  customers={customers}
                  bookings={bookings}
                  depth={0}
                  onViewTeam={handleViewTeam}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <>
          {/* Table Filters */}
          <div className="card p-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative flex-1 min-w-[200px]">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={treeSearch}
                  onChange={e => setTreeSearch(e.target.value)}
                  placeholder="Search by Name, Code, Mobile, Email..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                {treeSearch && (
                  <button onClick={() => setTreeSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={16} />
                  </button>
                )}
              </div>

              {/* Role Filter */}
              <div className="min-w-[180px]">
                <select
                  value={filterRole}
                  onChange={e => setFilterRole(e.target.value)}
                  className="input-field"
                >
                  <option value="">All Designations</option>
                  {["Admin", "Director", "Regional Manager", "Branch Manager", "BDM", "Sales Manager"].map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              {/* Date From */}
              <div>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="input-field"
                  placeholder="From Date"
                />
              </div>

              {/* Date To */}
              <div>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="input-field"
                  placeholder="To Date"
                />
              </div>

              {/* Clear Filters */}
              {(treeSearch || filterRole || dateFrom || dateTo) && (
                <button
                  onClick={() => {
                    setTreeSearch("");
                    setFilterRole("");
                    setDateFrom("");
                    setDateTo("");
                  }}
                  className="px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              )}

              <span className="text-xs text-gray-400 ml-auto">
                {filteredUsers.length} of {visibleUsers.length} users
              </span>
            </div>
          </div>

          {/* Table View */}
          <DataTable
            title="Team Members"
            columns={columns}
            data={filteredUsers}
            searchKey={["name", "email", "role", "mobile", "employeeCode", "region", "branch"]}
            onAdd={canCreateUser ? openAdd : undefined}
            addLabel={canCreateUser ? "+ Add User" : undefined}
            actions={(row) => (
              <>
                <button onClick={() => openView(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View">
                  <Eye size={15} />
                </button>
                <button onClick={() => openEdit(row)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Edit">
                  <Edit2 size={15} />
                </button>
                <button onClick={() => handleDelete(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                  <Trash2 size={15} />
                </button>
              </>
            )}
          />
        </>
      )}

      {/* Add Modal */}
      <AddUserModal
        key={modal === "add" ? "add-modal" : "closed"}
        isOpen={modal === "add"}
        onClose={() => { setModal(null); setCreatedUser(null); }}
        form={form}
        setForm={setForm}
        handleSave={handleSave}
        createdUser={createdUser}
        creatableRoles={creatableRoles}
        users={users}
        fetchReferredByName={fetchReferredByName}
        currentUserRole={user?.role}
        roleLevels={{
          "Admin": 0,
          "Director": 1,
          "Regional Manager": 2,
          "Branch Manager": 3,
          "BDM": 4,
          "Sales Manager": 5,
        }}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => { setShowSuccessModal(false); setCreatedUser(null); }}
        userData={createdUser}
      />

      {/* Edit Modal */}
      <Modal open={modal === "edit"} onClose={() => setModal(null)} title="Edit User" size="lg">
        <div className="space-y-4">
          {/* Personal Information */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Personal Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Full Name" required>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Full name" autoComplete="off" />
              </FormField>
              <FormField label="Father's/Husband Name">
                <input value={form.fatherHusbandName} onChange={e => setForm(p => ({ ...p, fatherHusbandName: e.target.value }))} className="input-field" placeholder="Enter father's/husband name" autoComplete="off" />
              </FormField>
              <FormField label="Email" required>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" placeholder="email@company.com" autoComplete="off" />
              </FormField>
              <FormField label="Mobile" required>
                <input value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} className="input-field" placeholder="10-digit mobile" autoComplete="off" />
              </FormField>
              <FormField label="Date of Birth">
                <input type="date" value={form.dob} onChange={e => setForm(p => ({ ...p, dob: e.target.value }))} className="input-field" autoComplete="off" />
              </FormField>
              <FormField label="Address" span>
                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="input-field resize-none" placeholder="Enter full address" rows="2" autoComplete="off" />
              </FormField>
            </div>
          </div>

          {/* Professional Information */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Professional Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Designation">
                <input value={form.role} className="input-field bg-gray-50" disabled />
              </FormField>
              <FormField label="User ID">
                <input value={form.employeeCode || ""} className="input-field bg-gray-50" disabled />
              </FormField>
              <FormField label="Referred By">
                <input value={(() => { const p = users.find(u => u.id === form.parentUserId); return p ? `${p.name} (${p.role})` : "—"; })()} className="input-field bg-gray-50" disabled />
              </FormField>
            </div>
          </div>

          {/* Nominee Information */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Nominee Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Nominee Name">
                <input value={form.nomineeName} onChange={e => setForm(p => ({ ...p, nomineeName: e.target.value }))} className="input-field" placeholder="Enter nominee name" autoComplete="off" />
              </FormField>
              <FormField label="Nominee Relationship">
                <input value={form.nomineeRelationship} onChange={e => setForm(p => ({ ...p, nomineeRelationship: e.target.value }))} className="input-field" placeholder="e.g., Spouse, Son, Daughter" autoComplete="off" />
              </FormField>
            </div>
          </div>

          {/* Bank Information */}
          <div className="border border-gray-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Bank Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Bank Name">
                <input value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))} className="input-field" placeholder="Enter bank name" autoComplete="off" />
              </FormField>
              <FormField label="Account No">
                <input value={form.bankAccountNo} onChange={e => setForm(p => ({ ...p, bankAccountNo: e.target.value }))} className="input-field" placeholder="Enter account number" autoComplete="off" />
              </FormField>
              <FormField label="IFSC Code">
                <input value={form.ifscCode} onChange={e => setForm(p => ({ ...p, ifscCode: e.target.value.toUpperCase() }))} className="input-field uppercase" placeholder="Enter IFSC code" autoComplete="off" />
              </FormField>
              <FormField label="Branch">
                <input value={form.bankBranch} onChange={e => setForm(p => ({ ...p, bankBranch: e.target.value }))} className="input-field" placeholder="Enter branch name" autoComplete="off" />
              </FormField>
              <FormField label="PAN No">
                <input value={form.panNo} onChange={e => setForm(p => ({ ...p, panNo: e.target.value.toUpperCase() }))} className="input-field uppercase" placeholder="Enter PAN number" autoComplete="off" />
              </FormField>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} className="btn-primary flex-1 justify-center py-2.5">Save Changes</button>
          <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === "view"} onClose={() => setModal(null)} title="User Details" size="lg">
        {selected && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 pb-5 border-b border-gray-100">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white text-2xl font-extrabold shadow-lg">
                {selected.name?.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="text-xl font-bold text-gray-900">{selected.name}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  <StatusBadge status={selected.role} />
                  <span className="text-xs text-gray-500 font-mono">{selected.employeeCode}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {/* Professional Information */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Professional Information</h4>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    ["User ID", selected.employeeCode || "—"],
                    ["Role", selected.role],
                    ["Referred By", (() => { const p = users.find(u => u.id === selected.parentUserId); return p ? `${p.name} (${p.role})` : "—"; })()],
                    ["Status", selected.status],
                    ["Joined", selected.joinDate],
                    ["Created By", (() => { const c = users.find(u => u.id === selected.createdBy); return c ? c.name : "—"; })()],
                  ].map(([k, v]) => {
                    if (k === "Status") {
                      return (
                        <div key={k} className="flex items-center justify-between py-1.5">
                          <span className="text-sm text-gray-500">{k}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            selected.status === "Active" 
                              ? "bg-green-50 text-green-700" 
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {v}
                          </span>
                        </div>
                      );
                    }
                    return (
                      <div key={k} className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-gray-500">{k}</span>
                        <span className="text-sm font-semibold text-gray-900">{String(v)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Personal Information */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Personal Information</h4>
                </div>
                <div className="p-4 space-y-2">
                  {[
                    ["Email", selected.email],
                    ["Mobile", selected.mobile],
                    ["Father's/Husband", selected.fatherHusbandName || "—"],
                    ["Date of Birth", selected.dob ? new Date(selected.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : "—"],
                    ["Address", selected.address || "—"],
                  ].map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between py-1.5">
                      <span className="text-sm text-gray-500">{k}</span>
                      <span className="text-sm font-semibold text-gray-900 text-right max-w-[60%]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nominee Information */}
              {(selected.nomineeName || selected.nomineeRelationship) && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Nominee Information</h4>
                  </div>
                  <div className="p-4 space-y-2">
                    {selected.nomineeName && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-gray-500">Nominee Name</span>
                        <span className="text-sm font-semibold text-gray-900">{selected.nomineeName}</span>
                      </div>
                    )}
                    {selected.nomineeRelationship && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-gray-500">Relationship</span>
                        <span className="text-sm font-semibold text-gray-900">{selected.nomineeRelationship}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bank Information */}
              {(selected.bankName || selected.bankAccountNo) && (
                <div className="border border-gray-200 rounded-xl overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                    <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Bank Information</h4>
                  </div>
                  <div className="p-4 space-y-2">
                    {selected.bankName && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-gray-500">Bank Name</span>
                        <span className="text-sm font-semibold text-gray-900">{selected.bankName}</span>
                      </div>
                    )}
                    {selected.bankAccountNo && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-gray-500">Account No</span>
                        <span className="text-sm font-mono font-semibold text-gray-900">{selected.bankAccountNo}</span>
                      </div>
                    )}
                    {selected.ifscCode && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-gray-500">IFSC Code</span>
                        <span className="text-sm font-mono font-semibold text-gray-900">{selected.ifscCode}</span>
                      </div>
                    )}
                    {selected.bankBranch && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-gray-500">Branch</span>
                        <span className="text-sm font-semibold text-gray-900">{selected.bankBranch}</span>
                      </div>
                    )}
                    {selected.panNo && (
                      <div className="flex items-center justify-between py-1.5">
                        <span className="text-sm text-gray-500">PAN No</span>
                        <span className="text-sm font-mono font-semibold text-gray-900">{selected.panNo}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Team Stats */}
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                  <h4 className="text-xs font-bold text-gray-600 uppercase tracking-wider">Team Statistics</h4>
                </div>
                <div className="p-4 grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Direct Team</p>
                    <p className="text-xl font-bold text-blue-700">{users.filter(u => u.parentUserId === selected.id).length}</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-xs text-gray-500 mb-1">Total Downline</p>
                    <p className="text-xl font-bold text-purple-700">
                      {(() => { const d = []; const q = [...users.filter(u => u.parentUserId === selected.id)]; while (q.length) { const c = q.shift(); d.push(c); q.push(...users.filter(u => u.parentUserId === c.id)); } return d.length; })()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {(() => {
              const reports = users.filter(u => u.parentUserId === selected.id);
              if (reports.length === 0) return null;
              return (
                <div className="pt-4 border-t border-gray-100">
                  <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Direct Reports ({reports.length})</div>
                  <div className="space-y-2">
                    {reports.map(r => (
                      <div key={r.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                          {r.name?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{r.name}</div>
                          <div className="flex items-center gap-1.5">
                            <StatusBadge status={r.role} />
                            <span className="text-[10px] text-gray-400 font-mono">{r.employeeCode}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}