import { useState } from "react";
import { useData } from "../../context/DataContext.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { BookOpen, Eye, Plus, IndianRupee, FileText, MessageSquare, CheckCircle, Bell, Home, Building2, Phone } from "lucide-react";
import { toast } from "react-toastify";

const empty = { 
  customerId: "", customerName: "", siteId: "", 
  propertyType: "Flat", projectName: "", projectNo: "", projectSqFt: "",
  applicantName: "", relation: "", address: "", pinCode: "", mobile: "", email: "",
  paymentMode: "Cash", bankName: "", chequeNo: "", chequeDate: "", transferId: "", loanOrOwn: "Own Fund",
  plotArea: "", pricePerSqft: "", plotPrice: "", paidAmount: "", status: "Booked", 
  salesManagerName: "", officeIdNo: "" 
};

export default function BookingManagement() {
  const { bookings, customers, sites, addBooking, updateBooking, updateCustomer } = useData();
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(empty);
  const [paymentAmt, setPaymentAmt] = useState("");
  const [mobileSearch, setMobileSearch] = useState("");
  const [foundCustomer, setFoundCustomer] = useState(null);

  const readyCustomers = customers.filter(c => c.status === "Ready for Booking");

  const totalRevenue = bookings.reduce((a, b) => a + (b.paidAmount || 0), 0);
  const totalPending = bookings.reduce((a, b) => a + (b.remainingAmount || 0), 0);

  const handleCustomerSelect = (cid) => {
    const c = customers.find(x => x.id === +cid);
    const s = sites.find(x => x.id === c?.siteId);
    if (c) {
      const pricePerSqft = s?.pricePerSqft || 5000;
      setForm(p => ({ 
        ...p, 
        customerId: c.id, 
        customerName: c.name,
        applicantName: c.name,
        relation: "", 
        address: c.address || "", 
        pinCode: c.pinCode || "", 
        mobile: c.mobile || "", 
        email: c.email || "",
        siteId: c.siteId, 
        salesManagerName: c.salesManagerName, 
        pricePerSqft,
        plotPrice: p.plotArea ? p.plotArea * pricePerSqft : ""
      }));
      setFoundCustomer(c);
      setMobileSearch(c.mobile || "");
    }
  };

  const handleMobileSearch = (mobile) => {
    setMobileSearch(mobile);
    if (mobile.length === 10) {
      const c = customers.find(x => x.mobile === mobile);
      if (c) {
        setFoundCustomer(c);
        const s = sites.find(x => x.id === c.siteId);
        const pricePerSqft = s?.pricePerSqft || 5000;
        setForm(p => ({
          ...p,
          customerId: c.id,
          customerName: c.name,
          applicantName: c.name,
          relation: "",
          address: c.address || "",
          pinCode: c.pinCode || "",
          mobile: c.mobile || "",
          email: c.email || "",
          siteId: c.siteId,
          salesManagerName: c.salesManagerName,
          pricePerSqft,
          plotPrice: p.plotArea ? p.plotArea * pricePerSqft : ""
        }));
        toast.success("Customer found! Details loaded ✓");
      } else {
        setFoundCustomer(null);
        toast.error("Customer not found with this mobile number");
      }
    } else {
      setFoundCustomer(null);
    }
  };

  const handleBook = () => {
    if (!form.customerId || !form.siteId || !form.plotArea || !form.paidAmount || !form.applicantName) { 
      toast.error("Fill all required fields"); 
      return; 
    }
    const siteName = sites.find(s => s.id === +form.siteId)?.name || "";
    const pricePerSqft = +form.pricePerSqft || 5000;
    const plotPrice = +form.plotArea * pricePerSqft;
    const remaining = plotPrice - +form.paidAmount;
    addBooking({ 
      ...form, 
      siteName, 
      projectName: form.projectName,
      projectNo: form.projectNo,
      pricePerSqft,
      plotPrice, 
      remainingAmount: remaining, 
      salesManagerId: 6,
      bookingDate: new Date().toISOString().split("T")[0]
    });
    updateCustomer(+form.customerId, { status: "Booked" });
    toast.success("Booking registered! WhatsApp notification sent 📱");
    setModal(null);
    setForm(empty);
    setFoundCustomer(null);
    setMobileSearch("");
  };

  const handlePayment = () => {
    if (!paymentAmt) { toast.error("Enter payment amount"); return; }
    const amt = +paymentAmt;
    const newPaid = (selected.paidAmount || 0) + amt;
    const newRemaining = (selected.remainingAmount || 0) - amt;
    const status = newRemaining <= 0 ? "Payment Done" : "Booked";
    updateBooking(selected.id, { paidAmount: newPaid, remainingAmount: Math.max(0, newRemaining), status });
    updateCustomer(selected.customerId, { status: "Payment Done", paymentAmount: newPaid });
    toast.success(`Payment of ₹${amt.toLocaleString("en-IN")} recorded! Invoice generated 📄`);
    setModal(null);
  };

  const columns = [
    { key: "invoiceNo", label: "Invoice" },
    { key: "customerName", label: "Customer", render: (v, row) => (<div><div className="font-semibold">{v}</div><div className="text-xs text-gray-400">{row.siteName}</div></div>) },
    { key: "projectNo", label: "Project No." },
    { key: "plotPrice", label: "Plot Price", render: v => `₹${Number(v).toLocaleString("en-IN")}` },
    { key: "paidAmount", label: "Paid", render: v => <span className="text-green-600 font-semibold">₹{Number(v).toLocaleString("en-IN")}</span> },
    { key: "remainingAmount", label: "Pending", render: v => <span className={`font-semibold ${v > 0 ? "text-red-500" : "text-green-500"}`}>₹{Number(v).toLocaleString("en-IN")}</span> },
    { key: "status", label: "Status", render: v => <StatusBadge status={v} /> },
    { key: "bookingDate", label: "Date" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 flex items-center gap-2"><BookOpen size={22} />Booking Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">{bookings.length} bookings · {readyCustomers.length} ready to book</p>
        </div>
        <button onClick={() => { setForm(empty); setFoundCustomer(null); setMobileSearch(""); setModal("add"); }} className="btn-primary"><Plus size={16} />New Booking</button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Bookings", value: bookings.length, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Revenue", value: `₹${(totalRevenue / 10000000).toFixed(1)}Cr`, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pending Amount", value: `₹${(totalPending / 100000).toFixed(0)}L`, color: "text-red-500", bg: "bg-red-50" },
          { label: "Ready to Book", value: readyCustomers.length, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(s => (
          <div key={s.label} className={`card p-4 ${s.bg}`}>
            <div className={`text-2xl font-extrabold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Ready to Book */}
      {readyCustomers.length > 0 && (
        <div className="card p-5 border-l-4 border-orange-400">
          <h3 className="font-bold text-orange-700 flex items-center gap-2 mb-3"><Bell size={18} /> Ready for Booking ({readyCustomers.length})</h3>
          <div className="flex flex-wrap gap-2">
            {readyCustomers.map(c => (
              <div key={c.id} className="bg-orange-50 border border-orange-200 rounded-xl px-3 py-2 flex items-center gap-2">
                <div className="w-7 h-7 bg-orange-400 rounded-full flex items-center justify-center text-white text-xs font-bold">{c.name.charAt(0)}</div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{c.name}</div>
                  <div className="text-xs text-gray-400">{c.siteName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <DataTable title="All Bookings" columns={columns} data={[...bookings].reverse()} searchKey={["customerName", "siteName", "projectNo", "invoiceNo", "status"]}
        actions={(row) => (
          <>
            <button onClick={() => { setSelected(row); setModal("view"); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"><Eye size={15} /></button>
            {row.remainingAmount > 0 && (
              <button onClick={() => { setSelected(row); setPaymentAmt(""); setModal("payment"); }} className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg text-xs font-semibold transition-colors">
                <IndianRupee size={12} />Pay
              </button>
            )}
          </>
        )}
      />

      {/* Add Booking Modal */}
      <Modal open={modal === "add"} onClose={() => setModal(null)} title="Register New Booking" size="xl">
        <div className="space-y-4">
          {/* Property Type & Date */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Property Type *</label>
              <select value={form.propertyType} onChange={e => setForm(p => ({ ...p, propertyType: e.target.value }))} className="input-field">
                <option>Flat</option>
                <option>Plot</option>
                <option>Villa</option>
              </select>
            </div>
            <div>
              <label className="label">Booking Date *</label>
              <input type="date" value={form.bookingDate} onChange={e => setForm(p => ({ ...p, bookingDate: e.target.value }))}
                className="input-field" min={new Date().toISOString().split("T")[0]} />
            </div>
            <div>
              <label className="label">Office ID No.</label>
              <input value={form.officeIdNo} onChange={e => setForm(p => ({ ...p, officeIdNo: e.target.value }))}
                className="input-field" placeholder="Internal reference" />
            </div>
          </div>

          {/* Customer Selection & Details */}
          <div>
            <label className="label">Search Customer by Mobile *</label>
            <div className="relative">
              <input 
                type="tel" 
                value={mobileSearch}
                onChange={e => handleMobileSearch(e.target.value)}
                className="input-field pr-10"
                placeholder="Enter 10-digit mobile number"
                maxLength={10}
              />
              {foundCustomer && (
                <CheckCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />
              )}
            </div>
            {foundCustomer && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-bold text-gray-800">{foundCustomer.name}</div>
                    <div className="text-xs text-gray-600">{foundCustomer.siteName} · {foundCustomer.email}</div>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    foundCustomer.status === "Ready for Booking" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}>
                    {foundCustomer.status}
                  </span>
                </div>
              </div>
            )}
          </div>
          
          {form.customerId && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <div>
                <label className="label">Applicant Name *</label>
                <input value={form.applicantName} onChange={e => setForm(p => ({ ...p, applicantName: e.target.value }))}
                  className="input-field" placeholder="Customer name" />
              </div>
              <div>
                <label className="label">Father/Husband Name</label>
                <input value={form.relation} onChange={e => setForm(p => ({ ...p, relation: e.target.value }))} className="input-field" placeholder="Name" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Address</label>
                <textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  className="input-field h-16 resize-none" placeholder="Full address" />
              </div>
              <div>
                <label className="label">Pin Code</label>
                <input type="number" value={form.pinCode} onChange={e => setForm(p => ({ ...p, pinCode: e.target.value }))}
                  className="input-field" placeholder="6-digit" maxLength={6} />
              </div>
              <div>
                <label className="label">Mobile</label>
                <input type="tel" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))}
                  className="input-field" placeholder="10-digit" maxLength={10} />
              </div>
              <div className="md:col-span-2">
                <label className="label">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="input-field" placeholder="email@example.com" />
              </div>
            </div>
          )}

          {/* Project Details */}
          <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
            <div className="text-xs font-semibold text-blue-900 mb-3">PROJECT DETAILS</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="label">Project Name *</label>
                <select value={form.siteId} onChange={e => {
                  const selectedSite = sites.find(s => s.id === +e.target.value);
                  setForm(p => ({ 
                    ...p, 
                    siteId: e.target.value,
                    projectName: selectedSite?.name || "",
                    projectNo: selectedSite ? `PRJ-${String(selectedSite.id).padStart(3, '0')}` : "",
                    pricePerSqft: selectedSite?.pricePerSqft || ""
                  }));
                }} className="input-field">
                  <option value="">Select project…</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Project No.</label>
                <input value={form.projectNo} readOnly className="input-field bg-white border-blue-200" placeholder="Auto-generated" />
              </div>
              <div>
                <label className="label">Price per sq.ft (₹)</label>
                <input value={form.pricePerSqft} readOnly className="input-field bg-white border-blue-200" placeholder="Fetched from project" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="label">Project Area (sq.yd.) *</label>
                <input type="number" value={form.plotArea} onChange={e => {
                  const area = e.target.value;
                  setForm(p => ({ 
                    ...p, 
                    plotArea: area,
                    plotPrice: area ? area * (+p.pricePerSqft || 5000) : ""
                  }));
                }} className="input-field" placeholder="200" />
              </div>
              <div>
                <label className="label">Project Price (₹) *</label>
                <input type="number" value={form.plotPrice} readOnly
                  className="input-field bg-white border-blue-200 font-semibold text-blue-700" placeholder="Auto-calculated" />
                {form.plotPrice && (
                  <p className="text-xs text-gray-500 mt-1">
                    = {form.plotArea} × ₹{form.pricePerSqft} = ₹{Number(form.plotPrice).toLocaleString("en-IN")}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="label font-semibold text-gray-700">Payment Mode *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
              {["Cheque", "DD", "Cash", "Online Transfer"].map(mode => (
                <label key={mode} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${form.paymentMode === mode ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                  <input type="radio" name="paymentMode" value={mode} checked={form.paymentMode === mode} onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value }))} className="hidden" />
                  <span className="text-sm font-semibold">{mode}</span>
                </label>
              ))}
            </div>
            
            {(form.paymentMode === "Cheque" || form.paymentMode === "DD") && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-xl">
                <div>
                  <label className="label">Bank Name</label>
                  <input value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))}
                    className="input-field" placeholder="Bank name" />
                </div>
                <div>
                  <label className="label">Cheque/DD No.</label>
                  <input value={form.chequeNo} onChange={e => setForm(p => ({ ...p, chequeNo: e.target.value }))}
                    className="input-field" placeholder="Cheque number" />
                </div>
                <div>
                  <label className="label">Date</label>
                  <input type="date" value={form.chequeDate} onChange={e => setForm(p => ({ ...p, chequeDate: e.target.value }))}
                    className="input-field" />
                </div>
              </div>
            )}
            
            {form.paymentMode === "Online Transfer" && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                <label className="label">Transfer ID</label>
                <input value={form.transferId} onChange={e => setForm(p => ({ ...p, transferId: e.target.value }))}
                  className="input-field" placeholder="Transaction ID" />
              </div>
            )}

            <div className="mt-4">
              <label className="label">Funding Type</label>
              <div className="grid grid-cols-2 gap-3 max-w-md">
                {["Own Fund", "Loan"].map(fund => (
                  <label key={fund} className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all ${form.loanOrOwn === fund ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                    <input type="radio" name="loanOrOwn" value={fund} checked={form.loanOrOwn === fund} onChange={e => setForm(p => ({ ...p, loanOrOwn: e.target.value }))} className="hidden" />
                    <span className="text-sm font-semibold">{fund}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Amount */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Paid Amount (₹) *</label>
              <input type="number" value={form.paidAmount} onChange={e => setForm(p => ({ ...p, paidAmount: e.target.value }))}
                className="input-field" placeholder="Token amount" />
            </div>
            <div>
              <label className="label">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input-field">
                <option>Booked</option>
                <option>Payment Done</option>
              </select>
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <button onClick={handleBook} className="btn-primary flex-1 justify-center py-2.5"><BookOpen size={16} />Register Booking</button>
          <button onClick={() => { setForm(empty); setFoundCustomer(null); setMobileSearch(""); }} className="btn-secondary flex-1 justify-center py-2.5"><span className="text-orange-600 font-semibold">Clear</span></button>
          <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
        </div>
      </Modal>

      {/* Payment Modal */}
      <Modal open={modal === "payment"} onClose={() => setModal(null)} title="Record Payment">
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-semibold">{selected.customerName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Plot Price</span><span className="font-semibold">₹{Number(selected.plotPrice).toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Paid So Far</span><span className="font-semibold text-green-600">₹{Number(selected.paidAmount).toLocaleString("en-IN")}</span></div>
              <div className="flex justify-between text-base font-bold"><span className="text-red-500">Remaining</span><span className="text-red-500">₹{Number(selected.remainingAmount).toLocaleString("en-IN")}</span></div>
            </div>
            <div><label className="label">Payment Amount (₹)</label><input type="number" value={paymentAmt} onChange={e => setPaymentAmt(e.target.value)} className="input-field" placeholder="Enter amount" /></div>
            <div className="flex gap-3">
              <button onClick={handlePayment} className="btn-primary flex-1 justify-center py-2.5 bg-green-600 hover:bg-green-700"><CheckCircle size={16} />Record Payment</button>
              <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* View Modal */}
      <Modal open={modal === "view"} onClose={() => setModal(null)} title="Booking Details">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div><div className="font-bold text-lg">{selected.customerName}</div><div className="text-gray-400 text-sm">{selected.siteName}</div></div>
              <StatusBadge status={selected.status} />
            </div>
            <div className="bg-blue-50 rounded-xl p-3 text-sm font-mono text-blue-700 font-semibold">{selected.invoiceNo}</div>
            <div className="grid grid-cols-2 gap-3">
              {[["Property Type", selected.propertyType], ["Project No.", selected.projectNo], ["Plot Area", `${selected.plotArea} sq.yd.`], ["Plot Price", `₹${Number(selected.plotPrice).toLocaleString("en-IN")}`], ["Paid", `₹${Number(selected.paidAmount).toLocaleString("en-IN")}`], ["Remaining", `₹${Number(selected.remainingAmount).toLocaleString("en-IN")}`], ["Booked On", selected.bookingDate], ["Payment Mode", selected.paymentMode]].map(([k, v]) => (
                <div key={k} className="bg-gray-50 rounded-xl p-3"><div className="text-xs text-gray-400 font-semibold">{k}</div><div className="font-bold text-gray-800 text-sm mt-0.5">{v}</div></div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => toast.success("Invoice downloaded (PDF) 📄")} className="btn-secondary flex-1 justify-center"><FileText size={15} />Invoice PDF</button>
              <button onClick={() => toast.success("WhatsApp notification sent! 📱")} className="btn-primary flex-1 justify-center"><MessageSquare size={15} />WhatsApp</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}