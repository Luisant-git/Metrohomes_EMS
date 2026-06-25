import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { User, Camera, Save, Mail, Phone, MapPin, Shield } from "lucide-react";
import toast from "react-hot-toast";

export default function WebProfile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...user });

  const handleSave = () => {
    updateProfile(form);
    setEditing(false);
    toast.success("Profile updated!");
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm(p => ({ ...p, avatar: ev.target.result }));
    };
    reader.readAsDataURL(file);
  };

  const roleColors = { "Admin": "bg-red-100 text-red-700", "Director": "bg-purple-100 text-purple-700", "Regional Manager": "bg-blue-100 text-blue-700", "Branch Manager": "bg-green-100 text-green-700", "BDM": "bg-yellow-100 text-yellow-700", "Sales Manager": "bg-orange-100 text-orange-700" };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><User size={22} />My Profile</h1>
        <p className="text-gray-400 text-sm mt-0.5">View and manage your profile information</p>
      </div>

      {/* Profile Header */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-blue-100 overflow-hidden flex items-center justify-center shadow-md">
              {form.avatar ? (
                <img src={form.avatar} alt={form.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-blue-600 text-4xl font-extrabold">{user?.name?.charAt(0)}</span>
              )}
            </div>
            {editing && (
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-blue-700 transition-colors">
                <Camera size={14} className="text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </label>
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{user?.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${roleColors[user?.role] || "bg-gray-100 text-gray-600"}`}>{user?.role}</span>
              <span className="text-xs text-gray-400">{user?.region ? `· ${user.region} Region` : ""}</span>
            </div>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-400"><Mail size={13} />{user?.email}</div>
            <div className="flex items-center gap-1 mt-1 text-sm text-gray-400"><Phone size={13} />{user?.mobile}</div>
          </div>
          <button onClick={() => setEditing(p => !p)} className={editing ? "btn-secondary" : "btn-primary"}>
            {editing ? "Cancel" : "Edit Profile"}
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-gray-800 flex items-center gap-2"><Shield size={16} />Profile Information</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Full Name", key: "name", type: "text" },
            { label: "Mobile", key: "mobile", type: "tel" },
            { label: "Email", key: "email", type: "email" },
            { label: "Role", key: "role", type: "text", readOnly: true },
            { label: "Region", key: "region", type: "text", readOnly: true },
            { label: "Branch", key: "branch", type: "text", readOnly: true },
          ].map(f => (
            <div key={f.key}>
              <label className="label">{f.label}</label>
              <input
                type={f.type}
                value={form[f.key] || ""}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                readOnly={!editing || f.readOnly}
                className={`input-field ${(!editing || f.readOnly) ? "bg-gray-50 text-gray-500 cursor-default" : ""}`}
              />
            </div>
          ))}
        </div>

        {editing && (
          <div className="flex gap-3 pt-2">
            <button onClick={handleSave} className="btn-primary px-6 py-2.5">
              <Save size={16} />Save Changes
            </button>
            <button onClick={() => { setEditing(false); setForm({ ...user }); }} className="btn-secondary px-6 py-2.5">
              Cancel
            </button>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Role Level", value: user?.role?.split(" ")[0] },
          { label: "Status", value: "Active" },
          { label: "Platform", value: "Web (Desktop)" },
        ].map(s => (
          <div key={s.label} className="card p-4 text-center">
            <div className="font-extrabold text-blue-600 text-lg">{s.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
