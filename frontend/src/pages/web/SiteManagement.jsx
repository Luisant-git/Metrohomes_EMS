import { useState } from "react";
import { useData } from "../../context/DataContext.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import StatCard from "../../components/StatCard.jsx";
import { SquarePen, Trash2, Eye, Building2, MapPin, FileText, Image as ImageIcon, X, Plus, File, Download, Loader2, AlertTriangle, Globe, CheckCircle, XCircle, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "react-toastify";
import { uploadAPI } from "../../api/upload.js";

const empty = { name: "", location: "", totalPlots: "", availablePlots: "", pricePerSqft: "", description: "", status: "Active", images: [], brochure: null, documents: [] };

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
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!form.name || !form.location) { toast.error("Name and location required"); return; }
    setSaving(true);
    try {
      const newImageFiles = (form.images || []).filter(img => typeof img !== 'string');
      const existingImageUrls = (form.images || []).filter(img => typeof img === 'string');
      let uploadedImageUrls = [];
      if (newImageFiles.length > 0) {
        const results = await uploadAPI.uploadImages(newImageFiles);
        uploadedImageUrls = results.map(r => r.url);
      }

      let brochureUrl = form.brochure;
      if (form.brochure && typeof form.brochure !== 'string') {
        const result = await uploadAPI.uploadFile(form.brochure);
        brochureUrl = result.url;
      }

      const newDocFiles = (form.documents || []).filter(doc => typeof doc !== 'string');
      const existingDocUrls = (form.documents || []).filter(doc => typeof doc === 'string');
      let uploadedDocUrls = [];
      if (newDocFiles.length > 0) {
        const results = await uploadAPI.uploadFiles(newDocFiles);
        uploadedDocUrls = results.map(r => r.url);
      }

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
        toast.success("Project added!");
      } else {
        await updateSite(selected.id, payload);
        toast.success("Project updated!");
      }
      setModal(null);
    } catch (err) {
      toast.error(err.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (s) => { setDeleteTarget(s); };

  const columns = [
    {
      key: "name", label: "Project Name", render: (v, row) => (
        <div>
          <div className="font-medium text-gray-800">{v}</div>
          <div className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{row.location}</div>
        </div>
      )
    },
    { key: "totalPlots", label: "Total Plots" },
    { key: "availablePlots", label: "Available" },
    { key: "pricePerSqft", label: "Price/sqft", render: v => `₹${Number(v).toLocaleString("en-IN")}` },
    { key: "status", label: "Status", render: v => <StatusBadge status={v} /> },
  ];

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteSite(deleteTarget.id);
      toast.success(`Project "${deleteTarget.name}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete project");
    }
  };

  const getFileName = (doc) => typeof doc === 'string' ? 'Document' : doc.name;

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-normal text-gray-900 flex items-center gap-2"><Building2 size={22} />Project Master</h1>
        <p className="text-gray-400 text-sm mt-0.5">{sites.length} total projects</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Globe} label="Total Projects" value={sites.length} color="blue" />
        <StatCard icon={CheckCircle} label="Active" value={sites.filter(s => s.status === "Active").length} color="green" />
        <StatCard icon={XCircle} label="Inactive" value={sites.filter(s => s.status === "Inactive").length} color="orange" />
        <StatCard icon={LayoutGrid} label="Total Plots" value={sites.reduce((a, s) => a + (s.totalPlots || 0), 0)} color="purple" />
      </div>

      <DataTable title="All Projects" columns={columns} data={sites} searchKey={["name", "location"]} onAdd={openAdd} addLabel="+ Add Project"
        actions={(row) => (
          <>
            <button onClick={() => openView(row)} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="View"><Eye size={15} /></button>
            <button onClick={() => openEdit(row)} className="p-1.5 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors" title="Edit"><SquarePen size={15} /></button>
            <button onClick={() => handleDelete(row)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
          </>
        )}
      />

      {/* Add/Edit Modal */}
      <Modal key={modal} open={modal === "add" || modal === "edit"} onClose={() => setModal(null)} title={modal === "add" ? "Add New Project" : "Edit Project"} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField label="Project Name" required>
            <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="input-field" placeholder="Project name" autoComplete="off" />
          </FormField>
          <FormField label="Location" required>
            <input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} className="input-field" placeholder="Area, City" autoComplete="off" />
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
            <div className="text-sm font-medium text-gray-700 mb-3">Upload Files</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Images */}
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:bg-blue-50/30 transition-all">
                <div className="flex flex-col items-center text-center">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                    <ImageIcon size={22} />
                  </div>
                  <p className="text-sm font-medium text-gray-700">Project Images</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">JPG, PNG, WebP</p>
                  <label className="mt-2.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-blue-700 transition-colors inline-flex items-center gap-1">
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
                  <p className="text-sm font-medium text-gray-700">Brochure</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">PDF, DOC</p>
                  <label className="mt-2.5 px-4 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-green-700 transition-colors inline-flex items-center gap-1">
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
                  <p className="text-sm font-medium text-gray-700">Documents</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">PDF, DOC, XLS</p>
                  <label className="mt-2.5 px-4 py-1.5 bg-purple-600 text-white text-xs font-medium rounded-lg cursor-pointer hover:bg-purple-700 transition-colors inline-flex items-center gap-1">
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
                  <div className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1"><ImageIcon size={12} className="text-blue-500" /> Images ({form.images.length})</div>
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
                  <div className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1"><FileText size={12} className="text-green-500" /> Brochure</div>
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
                  <div className="text-xs font-medium text-gray-500 mb-1.5 flex items-center gap-1"><File size={12} className="text-purple-500" /> Documents ({form.documents.length})</div>
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
            <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} className="input-field h-20 resize-none" placeholder="Project description..." />
          </FormField>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 justify-center py-2.5 disabled:opacity-50">
            {saving ? <><Loader2 size={16} className="animate-spin inline mr-1" /> Saving...</> : (modal === "add" ? "Add Project" : "Save Changes")}
          </button>
          <button onClick={() => setModal(null)} disabled={saving} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
        </div>
      </Modal>

      {/* View Modal */}
      <Modal open={modal === "view"} onClose={() => setModal(null)} title="Project Overview & Details" size="lg">
        {selected && (
          <div className="space-y-5">
            {/* Image Gallery */}
            {selected.images?.length > 0 && (
              <div className="relative rounded-xl overflow-hidden bg-gray-100">
                <div className="relative h-64 w-full">
                  <img 
                    src={typeof selected.images[imgIdx] === 'string' ? selected.images[imgIdx] : URL.createObjectURL(selected.images[imgIdx])} 
                    alt={selected.name} 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Image Navigation */}
                  {selected.images.length > 1 && (
                    <>
                      <button 
                        onClick={() => setImgIdx((prev) => (prev === 0 ? selected.images.length - 1 : prev - 1))}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all"
                      >
                        <ChevronLeft size={18} />
                      </button>
                      <button 
                        onClick={() => setImgIdx((prev) => (prev === selected.images.length - 1 ? 0 : prev + 1))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all"
                      >
                        <ChevronRight size={18} />
                      </button>
                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-black/60 text-white text-xs font-medium rounded-full">
                        {imgIdx + 1} / {selected.images.length}
                      </div>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {selected.images.length > 1 && (
                  <div className="flex gap-2 p-2 bg-white border-t overflow-x-auto">
                    {selected.images.map((img, i) => (
                      <button 
                        key={i} 
                        onClick={() => setImgIdx(i)} 
                        className={`relative h-12 w-16 flex-shrink-0 rounded-md overflow-hidden border-2 transition-all ${
                          i === imgIdx ? "border-blue-500" : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img src={typeof img === 'string' ? img : URL.createObjectURL(img)} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Header with Project Name, Location and Status */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-gray-200">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <StatusBadge status={selected.status} />
                </div>
                <h2 className="text-2xl  text-gray-800">{selected.name}</h2>
                <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                  <MapPin size={16} className="text-blue-500 flex-shrink-0" />
                  {selected.location}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                <Building2 size={24} className="text-blue-600" />
              </div>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-xs font-medium text-blue-600 uppercase tracking-wider">Total Plots</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{selected.totalPlots || 0}</p>
              </div>
              <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                <p className="text-xs font-medium text-green-600 uppercase tracking-wider">Available</p>
                <p className="text-xl font-bold text-gray-900 mt-1">{selected.availablePlots || 0}</p>
              </div>
              <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                <p className="text-xs font-medium text-purple-600 uppercase tracking-wider">Price/sqft</p>
                <p className="text-xl font-bold text-gray-900 mt-1">₹{Number(selected.pricePerSqft || 0).toLocaleString("en-IN")}</p>
              </div>
             
            </div>

           

            {/* Brochure Download */}
            {selected.brochure && (
              <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <FileText size={14} />
                  Project Brochure
                </h4>
                <a 
                  href={selected.brochure} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                >
                  <Download size={16} />
                  Download Brochure
                </a>
              </div>
            )}

            {/* Documents & Attachments */}
            {(selected.documents?.length > 0) && (
              <div className="bg-white rounded-xl p-4 border border-gray-200">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <File size={14} className="text-purple-600" />
                  Documents & Attachments
                </h4>
                <div className="space-y-2">
                  {selected.documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0">
                          <File size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">Document #{idx + 1}</p>
                          <p className="text-xs text-gray-500">Attachment File</p>
                        </div>
                      </div>
                      <a 
                        href={typeof doc === 'string' ? doc : URL.createObjectURL(doc)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        title="View Document"
                      >
                        <Download size={16} />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

             {/* Description */}
            {selected.description && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText size={14} className="text-blue-600" />
                  Description
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">{selected.description}</p>
              </div>
            )}

            {/* Close Button */}
            <div className="flex justify-end pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Project" size="sm">
        {deleteTarget && (
          <div className="text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-red-600" />
            </div>

            <h3 className="text-lg font-normal text-gray-900 mb-2">Are you sure you want to delete?</h3>
            <p className="text-sm text-gray-500 mb-1">
              You are about to delete this project:
            </p>
            <p className="text-sm font-medium text-gray-800 mb-4">
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