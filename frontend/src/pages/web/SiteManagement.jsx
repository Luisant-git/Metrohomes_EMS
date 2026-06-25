import { useState } from "react";
import { useData } from "../../context/DataContext.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { Edit2, Trash2, Eye, Building2, MapPin, Upload, FileText, Image as ImageIcon } from "lucide-react";
import toast from "react-hot-toast";

const empty = { name: "", location: "", type: "Residential", totalPlots: "", availablePlots: "", pricePerSqft: "", totalArea: "", description: "", status: "Active", images: [], brochure: null, documents: [] };

function FormField({ label, children, span }) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

export default function SiteManagement() {
  const { sites, addSite, updateSite, deleteSite } = useData();
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(empty);
  const [imgIdx, setImgIdx] = useState(0);

  const openAdd = () => { 
    setForm(empty); 
    setModal("add"); 
  };
  const openEdit = (s) => { 
    setSelected(s); 
    setForm({ 
      ...s, 
      images: s.images || [],
      brochure: s.brochure || null,
      documents: s.documents || []
    }); 
    setModal("edit"); 
  };
  const openView = (s) => { setSelected(s); setImgIdx(0); setModal("view"); };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const newImages = [...(form.images || []), ...files];
    setForm(p => ({ ...p, images: newImages }));
    toast.success(`${files.length} image(s) added`);
  };

  const handleBrochureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(p => ({ ...p, brochure: file }));
    toast.success("Brochure uploaded");
  };

  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    const newDocs = [...(form.documents || []), ...files];
    setForm(p => ({ ...p, documents: newDocs }));
    toast.success(`${files.length} document(s) added`);
  };

  const removeImage = (index) => {
    setForm(p => ({
      ...p,
      images: p.images.filter((_, i) => i !== index)
    }));
  };

  const removeDocument = (index) => {
    setForm(p => ({
      ...p,
      documents: p.documents.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    if (!form.name || !form.location) { toast.error("Name and location required"); return; }
    
    // Convert files to base64 for storage
    const processFiles = async () => {
      const processFile = (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(file);
        });
      };

      const [imageUrls, brochureUrl, documentUrls] = await Promise.all([
        Promise.all((form.images || []).map(processFile)),
        form.brochure ? processFile(form.brochure) : null,
        Promise.all((form.documents || []).map(processFile))
      ]);

      const payload = { 
        ...form, 
        totalPlots: +form.totalPlots, 
        availablePlots: +form.availablePlots, 
        pricePerSqft: +form.pricePerSqft, 
        images: imageUrls,
        brochure: brochureUrl,
        documents: documentUrls
      };

      if (modal === "add") { addSite(payload); toast.success("Site added!"); }
      else { updateSite(selected.id, payload); toast.success("Site updated!"); }
      setModal(null);
    };

    processFiles();
  };

  const handleDelete = (s) => {
    if (window.confirm(`Delete site "${s.name}"?`)) { deleteSite(s.id); toast.success("Site deleted"); }
  };

  const columns = [
    { key: "name", label: "Site Name", render: (v, row) => (
      <div>
        <div className="font-semibold text-gray-800">{v}</div>
        <div className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{row.location}</div>
      </div>
    )},
    { key: "type", label: "Type", render: v => <StatusBadge status={v} /> },
    { key: "totalPlots", label: "Total Plots" },
    { key: "availablePlots", label: "Available" },
    { key: "pricePerSqft", label: "Price/sqft", render: v => `₹${Number(v).toLocaleString("en-IN")}` },
    { key: "status", label: "Status", render: v => <StatusBadge status={v} /> },
  ];

  const F = ({ label, children, span }) => (
    <div className={span ? "sm:col-span-2" : ""}><label className="label">{label}</label>{children}</div>
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><Building2 size={22} />Site Master</h1>
        <p className="text-gray-400 text-sm mt-0.5">{sites.length} total sites</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Sites", value: sites.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active", value: sites.filter(s => s.status === "Active").length, color: "text-green-600", bg: "bg-green-50" },
          { label: "Inactive", value: sites.filter(s => s.status === "Inactive").length, color: "text-orange-600", bg: "bg-orange-50" },
          { label: "Total Plots", value: sites.reduce((a, s) => a + (s.totalPlots || 0), 0), color: "text-purple-600", bg: "bg-purple-50" },
        ].map(s => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <DataTable title="All Sites" columns={columns} data={sites} searchKey={["name", "location", "type"]} onAdd={openAdd} addLabel="+ Add Site"
        actions={(row) => (
          <>
            <button onClick={() => openView(row)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Eye size={15} /></button>
            <button onClick={() => openEdit(row)} className="p-1.5 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"><Edit2 size={15} /></button>
            <button onClick={() => handleDelete(row)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={15} /></button>
          </>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal key={modal} open={modal === "add" || modal === "edit"} onClose={() => setModal(null)} title={modal === "add" ? "Add New Site" : "Edit Site"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Site Name *">
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              className="input-field"
              placeholder="Site name"
              autoComplete="off"
            />
          </FormField>
          <FormField label="Location *">
            <input
              value={form.location}
              onChange={e => setForm(p => ({ ...p, location: e.target.value }))}
              className="input-field"
              placeholder="Area, City"
              autoComplete="off"
            />
          </FormField>
          <FormField label="Type">
            <select
              value={form.type}
              onChange={e => setForm(p => ({ ...p, type: e.target.value }))}
              className="input-field"
            >
              {["Residential", "Commercial", "Villa", "Industrial"].map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Total Area">
            <input
              value={form.totalArea}
              onChange={e => setForm(p => ({ ...p, totalArea: e.target.value }))}
              className="input-field"
              placeholder="e.g. 25 Acres"
            />
          </FormField>
          <FormField label="Total Plots">
            <input
              type="number"
              value={form.totalPlots}
              onChange={e => setForm(p => ({ ...p, totalPlots: e.target.value }))}
              className="input-field"
            />
          </FormField>
          <FormField label="Available Plots">
            <input
              type="number"
              value={form.availablePlots}
              onChange={e => setForm(p => ({ ...p, availablePlots: e.target.value }))}
              className="input-field"
            />
          </FormField>
          <FormField label="Price per Sqft (₹)">
            <input
              type="number"
              value={form.pricePerSqft}
              onChange={e => setForm(p => ({ ...p, pricePerSqft: e.target.value }))}
              className="input-field"
            />
          </FormField>
          <FormField label="Status">
            <select
              value={form.status}
              onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
              className="input-field"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </FormField>
          {/* Image Upload */}
          <FormField label="Site Images">
            <div className="space-y-3">
              <label className="flex items-center gap-2 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl cursor-pointer transition-colors">
                <ImageIcon size={18} />
                <span className="text-sm font-semibold">Upload Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
              {(form.images || []).length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {(form.images || []).map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img src={typeof img === 'string' ? img : URL.createObjectURL(img)} alt={`Preview ${idx}`} className="w-full h-16 object-cover rounded-lg border border-gray-200" />
                      <button
                        onClick={() => removeImage(idx)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          {/* Brochure Upload */}
          <FormField label="Brochure">
            <div className="space-y-2">
              <label className="flex items-center gap-2 px-4 py-3 bg-green-50 hover:bg-green-100 text-green-700 rounded-xl cursor-pointer transition-colors">
                <FileText size={18} />
                <span className="text-sm font-semibold">
                  {form.brochure ? "Change" : "Upload"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleBrochureUpload}
                  className="hidden"
                />
              </label>
              {form.brochure && (
                <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                  <FileText size={16} className="text-gray-500 flex-shrink-0" />
                  <span className="text-sm text-gray-700 flex-1 truncate">
                    {typeof form.brochure === 'string' ? 'Brochure uploaded' : form.brochure.name}
                  </span>
                </div>
              )}
            </div>
          </FormField>

          {/* Documents Upload */}
          <FormField label="Documents" span>
            <div className="space-y-2">
              <label className="flex items-center gap-2 px-4 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl cursor-pointer transition-colors">
                <Upload size={18} />
                <span className="text-sm font-semibold">Upload</span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  multiple
                  onChange={handleDocumentUpload}
                  className="hidden"
                />
              </label>
              {(form.documents || []).length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {(form.documents || []).map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 group hover:border-gray-300 transition-colors">
                      <FileText size={16} className="text-gray-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 flex-1 truncate">
                        {typeof doc === 'string' ? 'Document' : doc.name}
                      </span>
                      <span className="text-xs text-gray-400">#{idx + 1}</span>
                      <button
                        onClick={() => removeDocument(idx)}
                        className="text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </FormField>

          <FormField label="Description" span>
            <textarea
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="input-field h-20 resize-none"
              placeholder="Site description..."
            />
          </FormField>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} className="btn-primary flex-1 justify-center py-2.5">{modal === "add" ? "Add Site" : "Save Changes"}</button>
          <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === "view"} onClose={() => setModal(null)} title="Site Details" size="lg">
        {selected && (
          <div className="space-y-4">
            {selected.images?.length > 0 && (
              <div className="relative h-48 rounded-xl overflow-hidden bg-gray-100">
                <img src={selected.images[imgIdx]} alt={selected.name} className="w-full h-full object-cover" />
                {selected.images.length > 1 && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {selected.images.map((_, i) => (
                      <button key={i} onClick={() => setImgIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === imgIdx ? "bg-white w-4" : "bg-white/60"}`} />
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">{selected.name}</h3>
              <p className="text-gray-500 text-sm flex items-center gap-1 mt-1"><MapPin size={12} />{selected.location}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 font-medium mb-1">Type</div>
                <div className="font-semibold text-gray-800 text-sm"><StatusBadge status={selected.type} /></div>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 font-medium mb-1">Status</div>
                <div className="font-semibold text-gray-800 text-sm"><StatusBadge status={selected.status} /></div>
              </div>
              <div className="bg-purple-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 font-medium mb-1">Total Plots</div>
                <div className="font-bold text-gray-800 text-lg">{selected.totalPlots}</div>
              </div>
              <div className="bg-orange-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 font-medium mb-1">Available</div>
                <div className="font-bold text-gray-800 text-lg">{selected.availablePlots}</div>
              </div>
              <div className="bg-indigo-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 font-medium mb-1">Price/sqft</div>
                <div className="font-bold text-gray-800 text-sm">₹{Number(selected.pricePerSqft).toLocaleString("en-IN")}</div>
              </div>
              <div className="bg-pink-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 font-medium mb-1">Area</div>
                <div className="font-bold text-gray-800 text-sm">{selected.totalArea}</div>
              </div>
            </div>

            {selected.description && (
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="text-xs font-semibold text-gray-500 mb-2">Description</div>
                <p className="text-sm text-gray-700">{selected.description}</p>
              </div>
            )}

            {(selected.brochure || selected.documents?.length > 0) && (
              <div>
                <div className="text-xs font-semibold text-gray-500 mb-2">Documents</div>
                <div className="space-y-2">
                  {selected.brochure && (
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      <FileText size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700 flex-1">Brochure</span>
                    </div>
                  )}
                  {selected.documents?.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
                      <FileText size={16} className="text-gray-500" />
                      <span className="text-sm text-gray-700 flex-1">Document {idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}