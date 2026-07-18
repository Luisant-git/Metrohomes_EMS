import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { User, Camera, Save, Mail, Phone, Shield, LogOut, Edit2 } from "lucide-react";
import { toast } from "react-toastify";
import { uploadAPI } from "../../api/upload.js";
import { user as userAPI } from "../../api/user.js";

export default function WebProfile() {
  const { user, updateProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...user });
  const [photoFile, setPhotoFile] = useState(null);

  const handleSave = async () => {
    try {
      if (!form.name?.trim()) {
        toast.error("Name cannot be empty. Please enter your name.");
        return;
      }
      
      if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        toast.error("Please enter a valid email address.");
        return;
      }
      
      const updatedData = {
        name: form.name,
        email: form.email,
        avatar: form.avatar || user.avatar,
      };
      
      if (photoFile) {
        try {
          const result = await uploadAPI.uploadImage(photoFile);
          updatedData.avatar = result.url;
        } catch (err) {
          toast.error("Failed to upload image");
          return;
        }
      }
      
      // Save to backend via API
      await userAPI.update(user.id, updatedData);
      
      // Update local state
      await updateProfile(updatedData);
      
      setEditing(false);
      setPhotoFile(null);
      toast.success("Profile updated!");
    } catch (error) {
      toast.error("Something went wrong while saving. Please try again.");
    }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = ev => setForm(p => ({ ...p, avatar: ev.target.result }));
    reader.readAsDataURL(file);
  };

  const roleColors = {
    "Admin": "bg-red-500 text-white",
    "Director": "bg-purple-500 text-white",
    "Regional Manager": "bg-blue-500 text-white",
    "Branch Manager": "bg-green-500 text-white",
    "BDM": "bg-yellow-500 text-white",
    "Sales Manager": "bg-orange-500 text-white",
  };

  const getRoleBadgeClass = (role) => {
    return roleColors[role] || "bg-white/30 text-white";
  };

  return (
    <div className="w-full flex flex-col items-center space-y-6 animate-fadeIn pb-8">
      {/* Profile Header */}
      <div className="w-full bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl pt-8 pb-20 text-white text-center shadow-xl relative">
        <div className="relative inline-block">
          <div className="w-24 h-24 rounded-full bg-white/20 border-4 border-white/30 flex items-center justify-center overflow-hidden mx-auto shadow-xl">
            {form.avatar ? (
              <img src={form.avatar} alt={user?.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-extrabold text-white">{user?.name?.charAt(0)}</span>
            )}
          </div>
          {editing && (
            <label className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg border-2 border-white">
              <Camera size={14} className="text-white" />
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </label>
          )}
        </div>
        <div className="mt-4 font-extrabold text-2xl">{user?.name}</div>
        <div className={`inline-block mt-2 px-3 py-0.5 rounded-full text-xs font-semibold ${getRoleBadgeClass(user?.role)}`}>
          {user?.role}
        </div>
      </div>

      <div className="relative z-30 w-full max-w-3xl mx-auto -mt-12 bg-white rounded-3xl border border-gray-100 shadow-[0_25px_60px_rgba(15,23,42,0.15)] p-6 space-y-4 transition-all duration-300">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">My Information</h3>
          <button onClick={() => { setEditing(p => !p); if (editing) { setForm({ ...user }); setPhotoFile(null); } }}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all ${editing ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-600"}`}>
            <Edit2 size={12} />{editing ? "Cancel" : "Edit"}
          </button>
        </div>

        {/* Name */}
        <div>
          <label className="flex items-center gap-2 text-base font-bold text-gray-700 mb-2"><User size={20} className="text-blue-600" />Full Name</label>
          <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            readOnly={!editing}
            className={`w-full border rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none transition-all ${editing ? "border-blue-300 focus:ring-2 focus:ring-blue-500 bg-white" : "border-transparent bg-gray-50 text-gray-700"}`} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { icon: Mail, label: "Email", key: "email", type: "email" },
            { icon: Phone, label: "Mobile", key: "mobile", type: "tel", readOnly: true },
            { icon: Shield, label: "Role", key: "role", readOnly: true },
          ].map(f => (
            <div key={f.key} className={f.key === "email" ? "sm:col-span-3" : ""}>
              <label className="flex items-center gap-2 text-base font-bold text-gray-700 mb-2"><f.icon size={20} className="text-blue-600" />{f.label}</label>
              <input type={f.type || "text"} value={form[f.key] || "—"} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                readOnly={!editing || f.readOnly}
                className={`w-full border rounded-xl px-4 py-3 text-lg focus:outline-none transition-all ${editing && !f.readOnly ? "border-blue-300 focus:ring-2 focus:ring-blue-500 bg-white" : "border-transparent bg-gray-50 text-gray-500"}`} />
            </div>
          ))}
        </div>

        {editing && (
          <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm">
            <Save size={14} />Save Changes
          </button>
        )}
      </div>

      {/* Web info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 w-full max-w-3xl mx-auto">
        <h3 className="font-bold text-gray-800 text-sm mb-3">💻 Web Settings</h3>
        <div className="space-y-2 text-sm">
          {[
            ["Platform", "Web (Desktop)"],
            ["Browser Support", "Chrome, Firefox, Edge, Safari"],
            ["Auto Sync", "✅ Active"],
            ["Last Login", new Date().toLocaleString("en-IN")],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between items-center py-1">
              <span className="text-gray-500">{k}</span>
              <span className="font-semibold text-gray-700 text-right text-xs">{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="w-full max-w-3xl mx-auto">
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl transition-colors border border-red-100">
          <LogOut size={18} />Sign Out
        </button>
      </div>
      </div>
  );
}
