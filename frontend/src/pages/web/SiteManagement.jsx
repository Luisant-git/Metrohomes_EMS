import { useState } from "react";
import { useData } from "../../context/DataContext.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import StatCard from "../../components/StatCard.jsx";
import { SquarePen, Trash2, Eye, Building2, MapPin, FileText, Image as ImageIcon, X, Plus, File, Download, Loader2, AlertTriangle, Globe, CheckCircle, XCircle, LayoutGrid } from "lucide-react";
import { toast } from "react-toastify";
import { uploadAPI } from "../../api/upload.js";

const empty = { name: "", location: "", type: "Residential", totalPlots: "", availablePlots: "", pricePerSqft: "", totalArea: "", description: "", status: "Active", images: [], brochure: null, documents: [] };

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

export default function SiteManagement() {
  const { sites, addSite, updateSite, deleteSite } = useData();
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(empty);
  const [imgIdx, setImgIdx] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterType, setFilterType] = useState("");

  const filteredSites = filterType
    ? sites.filter(s => s.type === filterType)
    : sites;

  const openAdd = () => { setForm(empty); setModal("add"); };
  const openEdit = (s) => {
    setSelected(s);
    setForm({ ...s, images: s.images || [], brochure: s.brochure || null, documents: s.documents || [] });
    setModal("edit");
  };
  const openView = (s) => { setSelected(s); setImgIdx(0); setModal("view"); };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setForm(p => ({ ...p, images: [...(p.images || []), ...files] }));
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
    setForm(p => ({ ...p, documents: [...(p.documents || []), ...files] }));
    toast.success(`${files.length} document(s) added`);
  };

  const removeImage = (index) => setForm(p => ({ ...p, images: p.images.filter((_, i) => i !== index) }));
  const removeDocument = (index) => setForm(p => ({ ...p, documents: p.documents.filter((_, i) => i !== index) }));

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.location) { toast.error("Name and location required"); return; }
    setSaving(true);
    try {
      // Upload new image files and get URLs
      const newImageFiles = (form.images || []).filter(img => typeof img !== 'string');
      const existingImageUrls = (form.images || []).filter(img => typeof img === 'string');
      let uploadedImageUrls = [];
      if (newImageFiles.length > 0) {
        const results = await uploadAPI.uploadImages(newImageFiles);
        uploadedImageUrls = results.map(r => r.url);
      }

      // Upload new brochure file and get URL
      let brochureUrl = form.brochure;
      if (form.brochure && typeof form.brochure !== 'string') {
        const result = await uploadAPI.uploadFile(form.brochure);
        brochureUrl = result.url;
      }

      // Upload new document files and get URLs
      const newDocFiles = (form.documents || []).filter(doc => typeof doc !== 'string');
      const existingDocUrls = (form.documents || []).filter(doc => typeof doc === 'string');
      let uploadedDocUrls = [];
      if (newDocFiles.length > 0) {
        const results = await uploadAPI.uploadFiles(newDocFiles);
        uploadedDocUrls = results.map(r => r.url);
      }

      // Strip server-only fields that DTO validation rejects
      const { id, createdBy, createdAt, updatedAt, ...cleanForm } = form;
      const payload = {
        ...cleanForm,
        totalPlots: +form.totalPlots,
        availablePlots: +form.availablePlots,
        pricePerSqft: +form.pricePerSqft,
        images: [...existingImageUrls, ...uploadedImageUrls],
        brochure: brochureUrl,
        documents: [...existingDocUrls, ...uploadedDocUrls],
      };

      if (modal === "add") {
        await addSite(payload);
        toast.success("Site added!");
      } else {
        await updateSite(selected.id, payload);
        toast.success("Site updated!");
      }
      setModal(null);
    } catch (err) {
      toast.error(err.message || "Failed to save site");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (s) => { setDeleteTarget(s); };

  const columns = [
    {
      key: "name", label: "Site Name", render: (v, row) => (
        <div>
          <div className="font-semibold text-gray-800">{v}</div>
          <div className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{row.location}</div>
        </div>
      )
    },
    { key: "type", label: "Type", render: v => <StatusBadge status={v} /> },
    { key: "totalPlots", label: "Total Plots" },
    { key: "availablePlots", label: "Available" },
    { key: "pricePerSqft", label: "Price/sqft", render: v => `₹${Number(v).toLocaleString("en-IN")}` },
    { key: "status", label: "Status", render: v => <StatusBadge status={v} /> },
  ];

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSite(deleteTarget.id);
      toast.success(`Site "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete site");
    }
  };

  const getFileName = (doc) => typeof doc === 'string' ? 'Document' : doc.name;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><Building2 size={22} />Site Master</h1>
        <p className="text-gray-400 text-sm mt-0.5">{sites.length} total sites</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard icon={Globe} label="Total Sites" value={sites.length} color="blue" />
        <StatCard icon={CheckCircle} label="Active" value={sites.filter(s => s.status === "Active").length} color="green" />
        <StatCard icon={XCircle} label="Inactive" value={sites.filter(s => s.status === "Inactive").length} color="orange" />
        <StatCard icon={LayoutGrid} label="Total Plots" value={sites.reduce((a, s) => a + (s.totalPlots || 0), 0)} color="purple" />
        <StatCard icon={Building2} label="Filtered" value={filteredSites.length} color="teal" />
      </div>

      {/* Type Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterType("")}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${!filterType
            ? "bg-gray-900 text-white shadow-lg shadow-gray-200"
            : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
        >
          All
        </button>
        {["Residential", "Commercial", "Villa", "Industrial"].map(type => {
          const count = sites.filter(s => s.type === type).length;
          const isActive = filterType === type;
          const activeMap = {
            Residential: "bg-blue-600 text-white shadow-lg shadow-blue-200 border-blue-600",
            Commercial: "bg-purple-600 text-white shadow-lg shadow-purple-200 border-purple-600",
            Villa: "bg-green-600 text-white shadow-lg shadow-green-200 border-green-600",
            Industrial: "bg-orange-600 text-white shadow-lg shadow-orange-200 border-orange-600",
          };
          return (
            <button
              key={type}
              onClick={() => setFilterType(isActive ? "" : type)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${isActive ? activeMap[type] : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}
            >
              {type} <span className="ml-1 text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      <DataTable title="All Sites" columns={columns} data={filteredSites} searchKey={["name", "location", "type"]} onAdd={openAdd} addLabel="+ Add Site"
        actions={(row) => (
          <>
            <button onClick={() => openView(row)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="View"><Eye size={15} /></button>
            <button onClick={() => openEdit(row)} className="p-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors" title="Edit"><SquarePen size={15} /></button>
            <button onClick={() => handleDelete(row)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
          </>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal key={modal} open={modal === "add" || modal === "edit"} onClose={() => setModal(null)} title={modal === "add" ? "Add New Site" : "Edit Site"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Site Name" required>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Site name" autoComplete="off" />
          </FormField>
          <FormField label="Location" required>
            <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="input-field" placeholder="Area, City" autoComplete="off" />
          </FormField>
          <FormField label="Type">
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} className="input-field">
              {["Residential", "Commercial", "Villa", "Industrial"].map(t => <option key={t}>{t}</option>)}
            </select>
          </FormField>
          <FormField label="Total Area">
            <input value={form.totalArea} onChange={e => setForm(p => ({ ...p, totalArea: e.target.value }))} className="input-field" placeholder="e.g. 25 Acres" />
          </FormField>
          <FormField label="Total Plots">
            <input type="number" value={form.totalPlots} onChange={e => setForm(p => ({ ...p, totalPlots: e.target.value }))} className="input-field" />
          </FormField>
          <FormField label="Available Plots">
            <input type="number" value={form.availablePlots} onChange={e => setForm(p => ({ ...p, availablePlots: e.target.value }))} className="input-field" />
          </FormField>
          <FormField label="Price per Sqft (₹)">
            <input type="number" value={form.pricePerSqft} onChange={e => setForm(p => ({ ...p, pricePerSqft: e.target.value }))} className="input-field" />
          </FormField>
          <FormField label="Status">
            <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input-field">
              <option>Active</option>
              <option>Inactive</option>
            </select>
          </FormField>

          {/* Upload Section */}
          <div className="sm:col-span-2">
            <div className="text-sm font-semibold text-gray-700 mb-3">Upload Files</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Images */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                    <ImageIcon size={22} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Site Images</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WebP</p>
                  <label className="mt-2.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-flex items-center gap-1">
                    <Plus size={12} /> Add Images
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Brochure */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 hover:border-green-300 hover:bg-green-50/30 transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-xl bg-green-100 text-green-600 flex items-center justify-center mb-2">
                    <FileText size={22} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Brochure</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">PDF, DOC</p>
                  <label className="mt-2.5 px-4 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-green-700 transition-colors inline-flex items-center gap-1">
                    <Plus size={12} /> {form.brochure ? "Change" : "Upload"}
                    <input type="file" accept=".pdf,.doc,.docx" onChange={handleBrochureUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Documents */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 hover:border-purple-300 hover:bg-purple-50/30 transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center mb-2">
                    <File size={22} />
                  </div>
                  <p className="text-sm font-semibold text-gray-700">Documents</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">PDF, DOC, XLS</p>
                  <label className="mt-2.5 px-4 py-1.5 bg-purple-600 text-white text-xs font-semibold rounded-lg cursor-pointer hover:bg-purple-700 transition-colors inline-flex items-center gap-1">
                    <Plus size={12} /> Add Files
                    <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" multiple onChange={handleDocumentUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            {/* Uploaded previews */}
            <div className="mt-4 space-y-3">
              {/* Images preview */}
              {(form.images || []).length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1"><ImageIcon size={12} className="text-blue-500" /> Images ({form.images.length})</div>
                  <div className="grid grid-cols-6 gap-2">
                    {(form.images || []).map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img src={typeof img === 'string' ? img : URL.createObjectURL(img)} alt="" className="w-full h-14 object-cover rounded-lg border border-gray-200" />
                        <button onClick={() => removeImage(idx)} className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow hover:bg-red-600">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Brochure preview */}
              {form.brochure && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1"><FileText size={12} className="text-green-500" /> Brochure</div>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 rounded-lg border border-green-200">
                    <FileText size={16} className="text-green-600 flex-shrink-0" />
                    <span className="text-xs text-green-700 flex-1 truncate font-medium">
                      {typeof form.brochure === 'string' ? 'brochure.pdf' : form.brochure.name}
                    </span>
                    <button onClick={() => setForm(p => ({ ...p, brochure: null }))} className="w-5 h-5 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors">
                      <X size={10} />
                    </button>
                  </div>
                </div>
              )}

              {/* Documents preview */}
              {(form.documents || []).length > 0 && (
                <div>
                  <div className="text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1"><File size={12} className="text-purple-500" /> Documents ({form.documents.length})</div>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {(form.documents || []).map((doc, idx) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200 hover:border-purple-200 transition-colors">
                        <File size={14} className="text-purple-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 flex-1 truncate">{getFileName(doc)}</span>
                        <span className="text-[10px] text-gray-400">#{idx + 1}</span>
                        <button onClick={() => removeDocument(idx)} className="w-5 h-5 flex items-center justify-center bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors">
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <FormField label="Description" span>
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field h-20 resize-none" placeholder="Site description..." />
          </FormField>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-50">
            {saving ? <><Loader2 size={16} className="animate-spin inline mr-1" /> Saving...</> : (modal === "add" ? "Add Site" : "Save Changes")}
          </button>
          <button onClick={() => setModal(null)} disabled={saving} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
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
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 rounded-lg border border-green-200">
                      <FileText size={16} className="text-green-600" />
                      <span className="text-sm text-gray-700 flex-1 font-medium">Brochure</span>
                      <a href={selected.brochure} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                        <Download size={12} />
                      </a>
                    </div>
                  )}
                  {selected.documents?.map((doc, idx) => (
                    <div key={idx} className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <File size={16} className="text-purple-500" />
                      <span className="text-sm text-gray-700 flex-1">Document {idx + 1}</span>
                      <a href={doc} target="_blank" rel="noopener noreferrer" className="w-6 h-6 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors">
                        <Download size={12} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Site" size="sm">
        {deleteTarget && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-red-600" />
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-2">Are you sure you want to delete?</h3>
            <p className="text-sm text-gray-500 mb-1">
              You are about to delete this site:
            </p>
            <p className="text-sm font-semibold text-gray-800 mb-4">
              "{deleteTarget.name}"
            </p>

            <div className="flex gap-3">
              <button onClick={confirmDelete} className="btn-primary flex-1 justify-center py-2.5 bg-red-600 hover:bg-red-700 border-red-600">
                Yes, Delete
              </button>
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary flex-1 justify-center py-2.5">
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}