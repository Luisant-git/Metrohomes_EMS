import { useState, useEffect } from "react";
import { useData } from "../../context/DataContext.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { BookOpen, Eye, Plus, IndianRupee, FileText, MessageSquare, CheckCircle, Bell, Home, Building2, Phone, SquarePen, AlertCircle, Printer } from "lucide-react";
import { toast } from "react-toastify";
import { siteVisit } from "../../api/siteVisit.js";
import { booking as bookingApi } from "../../api/booking.js";

const empty = {
  customerId: "", customerName: "", siteId: "",
  projectName: "", projectNo: "",
  applicantName: "", relation: "", address: "", pinCode: "", mobile: "", email: "",
  paymentMode: "Cash", bankName: "", chequeNo: "", chequeDate: "", transferId: "", loanOrOwn: "Own Fund",
  plotArea: "", pricePerSqft: "", plotPrice: "", paidAmount: "", status: "Initial Payment",
  salesManagerName: "", officeIdNo: "", location: "", notes: "", guardianName: ""
};

export default function BookingManagement() {
  const { bookings, customers, sites, addBooking, updateBooking, updateCustomer, refreshCustomers, refreshBookings } = useData();
  const [modal, setModal] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ ...empty, bookingDate: new Date().toISOString().split("T")[0] });
  const [receipts, setReceipts] = useState([]);
  const [mobileSearch, setMobileSearch] = useState("");
  const [foundCustomer, setFoundCustomer] = useState(null);
  const [customerVisits, setCustomerVisits] = useState([]);
  const [saving, setSaving] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const readyCustomers = customers.filter(c => c.status === "Ready for Booking");
  const totalRevenue = bookings.reduce((a, b) => a + (b.paidAmount || 0), 0);
  const totalPending = bookings.reduce((a, b) => a + (b.remainingAmount || 0), 0);

  useEffect(() => {
    const allReceipts = [];
    bookings.forEach(booking => {
      if (booking.receipts && booking.receipts.length > 0) {
        booking.receipts.forEach(receipt => {
          allReceipts.push({
            ...receipt,
            customerName: booking.customerName || booking.customer?.name || '',
            siteName: booking.siteName || booking.site?.name || '',
            projectNo: booking.projectNo,
          });
        });
      }
    });
    setReceipts(allReceipts);
  }, [bookings]);

  const fetchCustomerVisits = async (customerId) => {
    try {
      const data = await siteVisit.getByCustomer(customerId);
      const visits = Array.isArray(data) ? data : (data.siteVisits || data.data || []);
      setCustomerVisits(visits);
    } catch (err) {
      console.error("Failed to fetch customer visits:", err);
      setCustomerVisits([]);
    }
  };

  const handleCustomerSelect = async (cid) => {
    const c = customers.find(x => x.id === +cid);
    if (c) {
      await fetchCustomerVisits(c.id);
      const pricePerSqft = 5000;
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
        salesManagerName: c.salesManagerName,
        pricePerSqft,
        plotPrice: p.plotArea ? p.plotArea * pricePerSqft : ""
      }));
      setFoundCustomer(c);
      setMobileSearch(c.mobile || "");
    }
  };

  const handleMobileSearch = async (mobile) => {
    setMobileSearch(mobile);
    if (mobile.length === 10) {
      const c = customers.find(x => x.mobile === mobile);
      if (c) {
        await fetchCustomerVisits(c.id);
        const existingBooking = bookings.find(b => b.customerId === c.id);
        setFoundCustomer({ ...c, existingBooking: existingBooking || null });
        const pricePerSqft = 5000;
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
          salesManagerName: c.salesManagerName,
          pricePerSqft,
          plotPrice: p.plotArea ? p.plotArea * pricePerSqft : ""
        }));
        toast.success("Customer found! Details loaded ✓");
      } else {
        setFoundCustomer(null);
        setCustomerVisits([]);
        toast.error("Customer not found with this mobile number");
      }
    } else {
      setFoundCustomer(null);
      setCustomerVisits([]);
    }
  };

  const handleBook = async () => {
    if (!form.customerId || !form.siteId || !form.plotArea || !form.paidAmount || !form.applicantName) {
      toast.error("Fill all required fields");
      return;
    }
    try {
      setSaving(true);
      const pricePerSqft = +form.pricePerSqft || 5000;
      const plotPrice = +form.plotArea * pricePerSqft;
      const remaining = plotPrice - +form.paidAmount;
      const payload = {
        customerId: Number(form.customerId),
        siteId: Number(form.siteId),
        bookingDate: form.bookingDate,
        applicantName: form.applicantName,
        relation: form.relation,
        address: form.address,
        pinCode: form.pinCode,
        mobile: form.mobile,
        email: form.email,
        plotArea: Number(form.plotArea),
        pricePerSqft: Number(pricePerSqft),
        plotPrice: Number(plotPrice),
        paidAmount: Number(form.paidAmount),
        remainingAmount: Number(remaining),
        paymentMode: form.paymentMode,
        bankName: form.bankName,
        chequeNo: form.chequeNo,
        chequeDate: form.chequeDate,
        transferId: form.transferId,
        loanOrOwn: form.loanOrOwn,
        status: form.status,
        assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
        assignedToUserName: form.salesManagerName,
        officeIdNo: form.officeIdNo,
        notes: form.notes,
        projectName: form.projectName,
        projectNo: form.projectNo,
        location: form.location,
      };
      await bookingApi.create(payload);
      await updateCustomer(+form.customerId, { status: "Booked" });
      await refreshBookings();
      toast.success("Booking registered! WhatsApp notification sent 📱");
      setModal(null);
      setForm(empty);
      setFoundCustomer(null);
      setMobileSearch("");
    } catch (err) {
      toast.error(err.message || "Failed to create booking");
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async () => {
    if (!form.paidAmount) { toast.error("Enter payment amount"); return; }
    try {
      setSaving(true);
      const amt = +form.paidAmount;
      await bookingApi.createReceipt({
        bookingId: foundCustomer.existingBooking.id,
        amount: amt,
        paymentMode: form.paymentMode,
        bankName: form.bankName,
        chequeNo: form.chequeNo,
        chequeDate: form.chequeDate,
        transferId: form.transferId,
      });
      await updateCustomer(foundCustomer.existingBooking.customerId, { status: "Booked" });
      await refreshBookings();
      toast.success(`Payment of ₹${amt.toLocaleString("en-IN")} recorded! Receipt generated 📄`);
      setModal(null);
      setForm(empty);
      setFoundCustomer(null);
      setMobileSearch("");
    } catch (err) {
      toast.error(err.message || "Failed to record payment");
    } finally {
      setSaving(false);
    }
  };

  const numberToWords = (num) => {
    if (num === 0) return "Zero";
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
    return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
  };

  const printInvoice = (row) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const receiptNo = row.receiptNo || '';
      const customerName = row.customerName || '';
      const siteName = row.siteName || '';
      const currentPayment = Number(row.currentPayment || 0);
      const totalPaid = Number(row.totalPaid || 0);
      const balance = Number(row.balance || 0);
      const paymentDate = row.paymentDate || new Date().toISOString().split('T')[0];
      const paymentMode = row.paymentMode || 'Cash';
      const rupeesInWords = numberToWords(currentPayment);
      const checkedCash = paymentMode === 'Cash' ? '✓' : '';
      const checkedDD = paymentMode === 'DD' ? '✓' : '';
      const checkedCheque = paymentMode === 'Cheque' ? '✓' : '';
      const checkedFundTransfer = paymentMode === 'Online Transfer' ? '✓' : '';
      printWindow.document.write(`
        <html><head><title>Receipt ${receiptNo}</title>
        <style>
          @page { size: A5; margin: 10mm; }
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 500px; margin: 0 auto; color: #1e3a8a; }
          .header { text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 10px; margin-bottom: 15px; }
          .logo { font-size: 28px; font-weight: bold; color: #1e3a8a; letter-spacing: 2px; margin-bottom: 5px; }
          .address { font-size: 11px; color: #333; line-height: 1.4; }
          .title { text-align: center; font-weight: bold; color: #dc2626; font-size: 14px; margin: 10px 0; letter-spacing: 1px; }
          .field { margin: 8px 0; font-size: 12px; }
          .field-label { font-weight: bold; color: #1e3a8a; }
          .dotted-line { border-bottom: 1px dotted #999; display: inline-block; width: 200px; margin-left: 5px; vertical-align: middle; }
          .checkbox-group { margin: 10px 0; }
          .checkbox-item { display: inline-block; margin-right: 15px; font-size: 12px; }
          .checkbox-box { display: inline-block; width: 14px; height: 14px; border: 2px solid #1e3a8a; margin-right: 4px; vertical-align: middle; text-align: center; line-height: 12px; font-size: 11px; font-weight: bold; }
          .amount-box { border: 2px solid #1e3a8a; border-radius: 8px; padding: 10px; margin: 15px 0; text-align: center; }
          .amount-symbol { font-size: 32px; font-weight: bold; color: #1e3a8a; }
          .summary { margin: 15px 0; padding: 10px; background: #f9fafb; border-radius: 6px; }
          .summary-row { display: flex; justify-content: space-between; margin: 5px 0; font-size: 12px; }
          .footer { margin-top: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
          .signature { text-align: center; font-size: 11px; color: #1e3a8a; margin-top: 30px; }
          .watermark { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); opacity: 0.05; font-size: 120px; color: #1e3a8a; font-weight: bold; pointer-events: none; }
        </style></head><body>
        <div class="watermark">MH</div>
        <div class="header">
          <div class="logo">METRO HOMES</div>
          <div class="address">#557, 17th Cross, 2nd Floor, 2nd Stage, Indiranagar, Bengaluru-560 038</div>
        </div>
        <div class="title">PAYMENT RECEIPT</div>
        <div class="field"><span class="field-label">Receipt No.</span><span class="dotted-line">${receiptNo}</span><span style="float: right;"><span class="field-label">Date:</span><span class="dotted-line" style="width: 120px;">${paymentDate}</span></span></div>
        <div class="field"><span class="field-label">Received from</span><span class="dotted-line" style="width: 300px;">${customerName}</span></div>
        <div class="field"><span class="field-label">Project</span><span class="dotted-line" style="width: 300px;">${siteName}</span></div>
        <div class="field checkbox-group"><span class="field-label">By</span><span class="checkbox-item"><span class="checkbox-box">${checkedCash}</span>Cash</span><span class="checkbox-item"><span class="checkbox-box">${checkedDD}</span>DD</span><span class="checkbox-item"><span class="checkbox-box">${checkedCheque}</span>Cheque</span><span class="checkbox-item"><span class="checkbox-box">${checkedFundTransfer}</span>Fund Transfer</span></div>
        <div class="summary">
          <div class="summary-row"><span>Current Payment:</span><span class="font-bold text-blue-600">₹${currentPayment.toLocaleString("en-IN")}</span></div>
          <div class="summary-row"><span>Total Paid:</span><span class="font-bold text-green-600">₹${totalPaid.toLocaleString("en-IN")}</span></div>
          <div class="summary-row"><span>Balance:</span><span class="font-bold text-red-600">₹${balance.toLocaleString("en-IN")}</span></div>
        </div>
        <div class="amount-box"><div class="amount-symbol">₹</div><div style="font-size: 20px; font-weight: bold; color: #1e3a8a;">${currentPayment.toLocaleString("en-IN")}</div><div style="font-size: 11px; color: #666; margin-top: 5px;">${rupeesInWords} Only</div></div>
        <div class="footer"><div style="flex: 1;"></div><div class="signature"><div style="border-top: 1px solid #1e3a8a; padding-top: 5px; min-width: 150px;">Authorised Signatory</div><div style="margin-top: 5px; font-weight: bold;">For Metro Homes</div></div></div>
        <div style="margin-top: 15px; text-align: center;"><button onclick="window.print()" style="padding: 8px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 12px;">Download PDF</button></div>
      </body></html>`);
      printWindow.document.close();
    }
  };

  const formatCurrency = (value) => {
    const num = Number(value || 0);
    return `₹${num.toLocaleString("en-US")}`;
  };

  const columns = [
    { key: "receiptNo", label: "Receipt No." },
    { key: "customerName", label: "Customer", render: (v, row) => (<div><div className="font-medium">{v}</div><div className="text-xs text-gray-400">{row.siteName}</div></div>) },
    { key: "projectNo", label: "Project No." },
    { key: "currentPayment", label: "Payment", render: v => <span className="text-blue-600 font-medium">{formatCurrency(v)}</span> },
    { key: "totalPaid", label: "Total Paid", render: v => <span className="text-green-600 font-medium">{formatCurrency(v)}</span> },
    { key: "balance", label: "Balance", render: v => <span className={`font-medium ${v > 0 ? "text-red-500" : "text-green-500"}`}>{formatCurrency(v)}</span> },
    { key: "paymentMode", label: "Mode", render: v => <StatusBadge status={v} /> },
    { key: "paymentDate", label: "Payment Date" },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-normal text-gray-900 flex items-center gap-2"><BookOpen size={22} />Booking Management</h1></div>
        <button onClick={() => {
          const today = new Date().toISOString().split("T")[0];
          setForm({ ...empty, bookingDate: today });
          setFoundCustomer(null);
          setMobileSearch("");
          setModal("add");
        }} className="btn-primary"><Plus size={16} />New Booking</button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Bookings", value: bookings.length, color: "text-blue-600" },
          { label: "Total Revenue", value: `₹${(totalRevenue / 10000000).toFixed(1)}Cr`, color: "text-green-600" },
          { label: "Pending Amount", value: `₹${(totalPending / 100000).toFixed(0)}L`, color: "text-red-500" },
          { label: "Ready to Book", value: readyCustomers.length, color: "text-orange-600" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <div className={`text-xl font-semibold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {readyCustomers.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-3"><Bell size={16} /> Ready for Booking ({readyCustomers.length})</h3>
          <div className="flex flex-wrap gap-2">
            {readyCustomers.map(c => (
              <div key={c.id} className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 flex items-center gap-2">
                <div className="w-6 h-6 bg-orange-400 rounded-full flex items-center justify-center text-white text-[10px] font-semibold">{c.name.charAt(0)}</div>
                <div><div className="text-sm text-gray-800">{c.name}</div><div className="text-[11px] text-gray-400">{c.siteName}</div></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <DataTable title="All Payment Receipts" columns={columns} data={[...receipts].reverse()} searchKey={["customerName", "siteName", "receiptNo"]}
          actions={(row) => (
            <>
              <button onClick={() => { setSelected(row); setModal("view"); }} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="View"><Eye size={15} /></button>
              <button onClick={() => printInvoice(row)} className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Print"><Printer size={15} /></button>
              <button onClick={() => toast.success("WhatsApp notification sent! 📱")} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="WhatsApp"><MessageSquare size={15} /></button>
            </>
          )}
        />
      </div>

      {/* Add Booking Modal */}
      <Modal open={modal === "add"} onClose={() => setModal(null)} title="Register New Booking" size="lg">
        <div className="space-y-5">
          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center"><FileText size={14} className="text-white" /></div>
              Booking Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="label">Booking Date</label><input type="date" value={form.bookingDate} onChange={e => setForm(p => ({ ...p, bookingDate: e.target.value }))} className="input-field" /></div>
              <div><label className="label">Office ID No.</label><input value={form.officeIdNo} onChange={e => setForm(p => ({ ...p, officeIdNo: e.target.value }))} className="input-field" placeholder="Internal reference" /></div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-green-600 flex items-center justify-center"><Phone size={14} className="text-white" /></div>Customer Details</h3>
            <div className="space-y-3">
              <div>
                <label className="label">Search Customer by Mobile *</label>
                <div className="relative">
                  <input type="tel" value={mobileSearch} onChange={e => handleMobileSearch(e.target.value)} className="input-field pr-10" placeholder="Enter 10-digit mobile number" maxLength={10} />
                  {foundCustomer && <CheckCircle size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600" />}
                </div>
                {foundCustomer && (
                  <div className="mt-2 p-3 bg-gray-50 border border-green-300 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div><div className="text-sm font-semibold text-gray-800">{foundCustomer.name}</div><div className="text-xs text-gray-600">{foundCustomer.mobile} · {foundCustomer.email}</div></div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${foundCustomer.status === "Ready for Booking" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>{foundCustomer.status}</span>
                    </div>
                  </div>
                )}
                {foundCustomer?.existingBooking && (
                  <div className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <h4 className="text-sm font-bold text-amber-900 mb-2">Previous Booking Details</h4>
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between"><span className="text-gray-600">Project</span><span className="font-medium text-gray-800">{foundCustomer.existingBooking.projectName || foundCustomer.existingBooking.siteName}</span></div>
                      <div className="flex justify-between"><span className="text-gray-600">Plot Price</span><span className="font-medium text-gray-800">₹{Number(foundCustomer.existingBooking.plotPrice).toLocaleString("en-IN")}</span></div>
                      <div className="flex justify-between border-t border-amber-200 pt-1.5"><span className="text-gray-600 font-medium">Already Paid</span><span className="font-bold text-green-600">₹{Number(foundCustomer.existingBooking.paidAmount || 0).toLocaleString("en-IN")}</span></div>
                      <div className="flex justify-between"><span className="text-red-600 font-medium">Remaining Balance</span><span className="font-bold text-red-600">₹{Number(foundCustomer.existingBooking.remainingAmount || 0).toLocaleString("en-IN")}</span></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {form.customerId && (
            <div>
              <h3 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-purple-600 flex items-center justify-center"><Building2 size={14} className="text-white" /></div>Applicant Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className="label">Applicant Name *</label><input value={form.applicantName} onChange={e => setForm(p => ({ ...p, applicantName: e.target.value }))} className="input-field" placeholder="Customer name" /></div>
                <div><label className="label">Guardian Name</label><input value={form.guardianName || ''} onChange={e => setForm(p => ({ ...p, guardianName: e.target.value }))} className="input-field" placeholder="Guardian name (optional)" /></div>
                <div className="md:col-span-2"><label className="label">Address</label><textarea value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className="input-field h-16 resize-none" placeholder="Full address" /></div>
                <div><label className="label">Pin Code</label><input type="number" value={form.pinCode} onChange={e => setForm(p => ({ ...p, pinCode: e.target.value }))} className="input-field" placeholder="6-digit" maxLength={6} /></div>
                <div><label className="label">Mobile</label><input type="tel" value={form.mobile} onChange={e => setForm(p => ({ ...p, mobile: e.target.value }))} className="input-field" placeholder="10-digit" maxLength={10} /></div>
                <div className="md:col-span-2"><label className="label">Email</label><input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} className="input-field" placeholder="email@example.com" /></div>
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><div className="w-6 h-6 rounded-lg bg-amber-600 flex items-center justify-center"><Home size={14} className="text-white" /></div>Project Details</h3>
            {foundCustomer?.existingBooking ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-3 border border-amber-200"><div className="text-xs text-gray-500 mb-1">Project Name</div><div className="text-sm font-medium text-gray-800">{foundCustomer.existingBooking.projectName || foundCustomer.existingBooking.siteName || 'N/A'}</div></div>
                <div className="bg-white rounded-lg p-3 border border-amber-200"><div className="text-xs text-gray-500 mb-1">Project No.</div><div className="text-sm font-medium text-gray-800">{foundCustomer.existingBooking.projectNo || 'N/A'}</div></div>
                <div className="bg-white rounded-lg p-3 border border-amber-200"><div className="text-xs text-gray-500 mb-1">Plot Area</div><div className="text-sm font-medium text-gray-800">{foundCustomer.existingBooking.plotArea ? `${foundCustomer.existingBooking.plotArea} sq.yd.` : 'N/A'}</div></div>
                <div className="bg-white rounded-lg p-3 border border-amber-200"><div className="text-xs text-gray-500 mb-1">Price per sq.ft</div><div className="text-sm font-medium text-gray-800">₹{Number(foundCustomer.existingBooking.pricePerSqft || 0).toLocaleString("en-IN")}</div></div>
                <div className="col-span-2 bg-white rounded-lg p-3 border border-amber-200"><div className="text-xs text-gray-500 mb-1">Total Plot Price</div><div className="text-sm font-bold text-amber-700">₹{Number(foundCustomer.existingBooking.plotPrice || 0).toLocaleString("en-IN")}</div></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div><label className="label">Project Name <span className="text-red-500 ml-1">*</span></label>
                  <select value={form.siteId} onChange={e => {
                    const selectedSite = sites.find(s => s.id === +e.target.value);
                    setForm(p => ({ ...p, siteId: e.target.value, projectName: selectedSite?.name || "", projectNo: selectedSite ? `PRJ-${String(selectedSite.id).padStart(3, '0')}` : "", pricePerSqft: selectedSite?.pricePerSqft || "", location: selectedSite?.location || "" }));
                  }} className="input-field">
                    <option value="">Select project…</option>
                    {form.customerId && customerVisits.length > 0 ? sites.filter(s => customerVisits.some(v => v.siteId === s.id)).map(s => <option key={s.id} value={s.id}>{s.name}</option>) : sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="label">Project No.</label><input value={form.projectNo} readOnly className="input-field bg-white border-amber-200" placeholder="Auto-generated" /></div>
                  <div><label className="label">Price per sq.ft (₹)</label><input value={form.pricePerSqft} readOnly className="input-field bg-white border-amber-200" placeholder="Fetched from project" /></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="label">Project Area (sq.yd.) *</label><input type="number" value={form.plotArea} onChange={e => { const area = e.target.value; setForm(p => ({ ...p, plotArea: area, plotPrice: area ? area * (+p.pricePerSqft || 5000) : "" })); }} className="input-field" placeholder="200" /></div>
                  <div><label className="label">Project Price (₹) *</label><input type="number" value={form.plotPrice} readOnly className="input-field bg-white border-amber-200 font-medium text-amber-700" placeholder="Auto-calculated" /></div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="label font-medium text-gray-700">Payment Mode <span className="text-red-500 ml-1">*</span></label>
            <div className="flex flex-wrap gap-3 mt-2">
              {["Cheque", "DD", "Cash", "Online Transfer"].map(mode => (
                <label key={mode} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${form.paymentMode === mode ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                  <input type="radio" name="paymentMode" value={mode} checked={form.paymentMode === mode} onChange={e => setForm(p => ({ ...p, paymentMode: e.target.value }))} className="hidden" />
                  <div className="flex-shrink-0 w-3.5 h-3.5">{form.paymentMode === mode ? (<div className="w-full h-full rounded-full border-2 border-blue-600 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div></div>) : (<div className="w-full h-full rounded-full border-2 border-gray-300"></div>)}</div>
                  <span className="text-sm font-medium whitespace-nowrap">{mode}</span>
                </label>
              ))}
            </div>

            {(form.paymentMode === "Cheque" || form.paymentMode === "DD") && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-4 bg-gray-50 rounded-xl">
                <div><label className="label">Bank Name</label><input value={form.bankName} onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))} className="input-field" placeholder="Bank name" /></div>
                <div><label className="label">Cheque/DD No.</label><input value={form.chequeNo} onChange={e => setForm(p => ({ ...p, chequeNo: e.target.value }))} className="input-field" placeholder="Cheque number" /></div>
                <div><label className="label">Date</label><input type="date" value={form.chequeDate} onChange={e => setForm(p => ({ ...p, chequeDate: e.target.value }))} className="input-field" /></div>
              </div>
            )}
            {form.paymentMode === "Online Transfer" && (
              <div className="mt-4 p-4 bg-gray-50 rounded-xl"><label className="label">Transfer ID</label><input value={form.transferId} onChange={e => setForm(p => ({ ...p, transferId: e.target.value }))} className="input-field" placeholder="Transaction ID" /></div>
            )}
            <div className="mt-4">
              <label className="label">Funding Type</label>
              <div className="flex gap-3">
                {["Own Fund", "Loan"].map(fund => (
                  <label key={fund} className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border-2 cursor-pointer transition-all ${form.loanOrOwn === fund ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"}`}>
                    <input type="radio" name="loanOrOwn" value={fund} checked={form.loanOrOwn === fund} onChange={e => setForm(p => ({ ...p, loanOrOwn: e.target.value }))} className="hidden" />
                    <div className="flex-shrink-0 w-3.5 h-3.5">{form.loanOrOwn === fund ? (<div className="w-full h-full rounded-full border-2 border-blue-600 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div></div>) : (<div className="w-full h-full rounded-full border-2 border-gray-300"></div>)}</div>
                    <span className="text-sm font-medium whitespace-nowrap">{fund}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Paid Amount (₹) *</label><input type="number" value={form.paidAmount} onChange={e => setForm(p => ({ ...p, paidAmount: e.target.value }))} className="input-field" placeholder="Token amount" /></div>
            <div><label className="label">Payment Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))} className="input-field">
                <option value="Initial Payment">Initial Payment</option>
                <option value="Part Payment">Part Payment</option>
                <option value="Full Payment">Full Payment</option>
              </select>
            </div>
          </div>

          <div><label className="label">Notes</label><textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} className="input-field h-20 resize-none" placeholder="Add any additional notes..." /></div>
        </div>
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <button onClick={() => setConfirmOpen(true)} className="btn-primary flex-1 justify-center py-2.5">{foundCustomer?.existingBooking ? <><IndianRupee size={16} /> Pay Now</> : <><BookOpen size={16} />Register Booking</>}</button>
          {!foundCustomer?.existingBooking && (<button onClick={() => { setForm(empty); setFoundCustomer(null); setMobileSearch(""); }} className="btn-secondary flex-1 justify-center py-2.5"><span className="text-orange-600 font-medium">Clear</span></button>)}
          <button onClick={() => setModal(null)} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
        </div>

        <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={foundCustomer?.existingBooking ? "Confirm Payment" : "Confirm Booking"} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{foundCustomer?.existingBooking ? "Are you sure you want to record this payment?" : "Are you sure you want to register this booking?"}</p>
            {foundCustomer?.existingBooking ? (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium">{foundCustomer.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Project</span><span className="font-medium">{foundCustomer.existingBooking.projectName || foundCustomer.existingBooking.siteName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Plot Price</span><span className="font-medium">₹{Number(foundCustomer.existingBooking.plotPrice || 0).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-500">Previous Paid</span><span className="font-medium text-gray-600">₹{Number(foundCustomer.existingBooking.paidAmount || 0).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Current Payment</span><span className="font-medium text-blue-600">₹{Number(form.paidAmount || 0).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold"><span>Total Paid</span><span className="text-green-600">₹{Number((foundCustomer.existingBooking.paidAmount || 0) + Number(form.paidAmount || 0)).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span className="text-red-500">Remaining</span><span className="text-red-500">₹{Number((foundCustomer.existingBooking.remainingAmount || 0) - Number(form.paidAmount || 0)).toLocaleString("en-IN")}</span></div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium">{form.applicantName || foundCustomer?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Project</span><span className="font-medium">{form.projectName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Plot Price</span><span className="font-medium">₹{Number(form.plotPrice || 0).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-500">Previous Paid</span><span className="font-medium text-gray-600">₹0</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Today's Payment</span><span className="font-medium text-blue-600">₹{Number(form.paidAmount || 0).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold"><span>Total Paid</span><span className="text-green-600">₹{Number(form.paidAmount || 0).toLocaleString("en-IN")}</span></div>
                <div className="flex justify-between"><span className="text-red-500">Remaining</span><span className="text-red-500">₹{Number((Number(form.plotPrice || 0) - Number(form.paidAmount || 0))).toLocaleString("en-IN")}</span></div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={async () => { setConfirmOpen(false); if (foundCustomer?.existingBooking) { await handlePayment(); } else { await handleBook(); } }} className="btn-primary flex-1 justify-center py-2.5">{foundCustomer?.existingBooking ? "Confirm Payment" : "Yes, Confirm"}</button>
              <button onClick={() => setConfirmOpen(false)} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
            </div>
          </div>
        </Modal>
      </Modal>

      {/* View Modal - Simple Receipt Details */}
      <Modal open={modal === "view"} onClose={() => setModal(null)} title="Receipt Details" size="md">
        {selected && (
          <div className="space-y-1">
            {/* Header Row */}
            <div className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3 mb-4">
              <div><div className="text-xs text-gray-400">Receipt No</div><div className="font-bold text-gray-900">{selected.receiptNo}</div></div>
              <div className="text-right"><div className="text-xs text-gray-400">Date</div><div className="font-medium text-gray-700">{selected.paymentDate}</div></div>
            </div>

            {/* Info Rows */}
            <div className="text-sm border-b border-gray-100 pb-3 mb-3 flex justify-between">
              <span className="text-gray-500">Customer</span>
              <span className="font-medium text-gray-800">{selected.customerName}</span>
            </div>
            <div className="text-sm border-b border-gray-100 pb-3 mb-3 flex justify-between">
              <span className="text-gray-500">Project</span>
              <span className="font-medium text-gray-800">{selected.siteName}</span>
            </div>
            <div className="text-sm border-b border-gray-100 pb-3 mb-3 flex justify-between">
              <span className="text-gray-500">Payment Mode</span>
              <span className="font-medium text-gray-800">{selected.paymentMode}</span>
            </div>

            {/* Bank/Transfer Details */}
            {(selected.bankName || selected.transferId) && (
              <div className="text-sm border-b border-gray-100 pb-3 mb-3">
                {selected.bankName && (
                  <div className="flex justify-between mb-1">
                    <span className="text-gray-500">Bank</span>
                    <span className="text-gray-800">{selected.bankName} {selected.chequeNo ? `· ${selected.chequeNo}` : ''} {selected.chequeDate ? `· ${selected.chequeDate}` : ''}</span>
                  </div>
                )}
                {selected.transferId && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Transaction ID</span>
                    <span className="text-blue-700 font-mono">{selected.transferId}</span>
                  </div>
                )}
              </div>
            )}

            {/* Amounts */}
            <div className="text-sm border-b border-gray-100 pb-3 mb-3 flex justify-between">
              <span className="text-gray-500">Current Payment</span>
              <span className="font-semibold text-blue-600">₹{Number(selected.currentPayment).toLocaleString("en-IN")}</span>
            </div>
            <div className="text-sm border-b border-gray-100 pb-3 mb-3 flex justify-between">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-semibold text-green-600">₹{Number(selected.totalPaid).toLocaleString("en-IN")}</span>
            </div>
            <div className="text-sm border-b border-gray-100 pb-3 mb-3 flex justify-between">
              <span className="text-gray-500">Balance</span>
              <span className={`font-semibold ${Number(selected.balance) > 0 ? 'text-red-500' : 'text-green-500'}`}>₹{Number(selected.balance).toLocaleString("en-IN")}</span>
            </div>

            {/* Amount in Words */}
            <p className="text-xs text-gray-400 italic text-center mt-2">
              Rupees {numberToWords(Number(selected.currentPayment))} Only
            </p>

          </div>
        )}
      </Modal>
    </div>
  );
}