import { useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useData } from "../../context/DataContext.jsx";
import { Camera, Save, Phone, Mail, User, Shield, LogOut, Edit2 } from "lucide-react";
import { toast } from "react-toastify";
import { uploadAPI } from "../../api/upload.js";
import { user as userAPI } from "../../api/user.js";

export default function PWAProfile() {
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
    "Regional Manager": "bg-blue-500",
    "Branch Manager": "bg-green-500",
    "BDM": "bg-yellow-500",
    "Sales Manager": "bg-orange-500",
  };

  const infoItems = [
    { icon: Mail, label: "Email", key: "email", type: "email" },
    { icon: Phone, label: "Mobile", key: "mobile", type: "tel", readOnly: true },
    { icon: Shield, label: "Role", key: "role", readOnly: true },
  ];

  return (
    <div className="pb-24">
      {/* Profile header */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 px-4 pt-4 pb-12 text-white text-center">
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
        <div className="mt-3 font-extrabold text-xl">{user?.name}</div>
        <div className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${roleColors[user?.role] || "bg-white/20"} bg-opacity-90`}>
          {user?.role}
        </div>
      </div>

      <div className="px-4 -mt-6 space-y-4">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-gray-800">My Information</h3>
            <button onClick={() => { setEditing(p => !p); if (editing) { setForm({ ...user }); setPhotoFile(null); } }}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${editing ? "bg-gray-100 text-gray-600" : "bg-blue-50 text-blue-600"}`}>
              <Edit2 size={12} />{editing ? "Cancel" : "Edit"}
            </button>
          </div>

          {/* Name special */}
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5"><User size={12} />Full Name</label>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              readOnly={!editing}
              className={`w-full border rounded-xl px-3 py-2.5 text-sm font-semibold focus:outline-none transition-all ${editing ? "border-blue-300 focus:ring-2 focus:ring-blue-500 bg-white" : "border-transparent bg-gray-50 text-gray-700"}`} />
          </div>

          {infoItems.map(f => (
            <div key={f.key}>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 mb-1.5"><f.icon size={12} />{f.label}</label>
              <input type={f.type || "text"} value={form[f.key] || "—"} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                readOnly={!editing || f.readOnly}
                className={`w-full border rounded-xl px-3 py-2.5 text-sm focus:outline-none transition-all ${editing && !f.readOnly ? "border-blue-300 focus:ring-2 focus:ring-blue-500 bg-white" : "border-transparent bg-gray-50 text-gray-500"}`} />
            </div>
          ))}

          {editing && (
            <button onClick={handleSave} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
              <Save size={16} />Save Changes
            </button>
          )}
        </div>

      

        {/* Logout */}
        <button onClick={logout} className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-4 rounded-2xl transition-colors border border-red-100">
          <LogOut size={18} />Sign Out
        </button>
      </div>
    </div>
  );
}
