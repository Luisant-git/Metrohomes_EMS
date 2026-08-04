import { useState, useEffect } from "react";
import { useData } from "../../context/DataContext.jsx";
import StatCard from "../../components/StatCard.jsx";
import DataTable from "../../components/DataTable.jsx";
import Modal from "../../components/Modal.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { BookOpen, Eye, Plus, IndianRupee, FileText, MessageSquare, CheckCircle, Bell, Home, Building2, Phone, SquarePen, AlertCircle, Download, MapPin, XCircle } from "lucide-react";
import { toast } from "react-toastify";
import { siteVisit } from "../../api/siteVisit.js";
import { booking as bookingApi } from "../../api/booking.js";
import { customer as customerApi } from "../../api/customer.js";
import { formatINR, formatIndianNumber } from "../../utils/format.js";

const empty = {
  customerId: "", customerName: "", siteId: "", projectId: "",
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
  const [confirming, setConfirming] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successData, setSuccessData] = useState(null);
  const [whatsappRow, setWhatsappRow] = useState(null);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [cancelRow, setCancelRow] = useState(null);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('bookings'); // 'bookings' | 'receipts'
  const [tableProjectFilter, setTableProjectFilter] = useState("");
  const [tableSiteFilter, setTableSiteFilter] = useState("");
  const [tableStatusFilter, setTableStatusFilter] = useState("");
  const [tableSearchResetKey, setTableSearchResetKey] = useState(0);
  const [cancelForm, setCancelForm] = useState({ mobile: "", otp: "", cancellationReason: "", refundAmount: "" });
  const [otpSending, setOtpSending] = useState(false);
  const [canceling, setCanceling] = useState(false);

  const handleDownloadPdf = async (row) => {
    try {
      const blob = await bookingApi.downloadReceiptPdf(row.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${row.receiptNo || 'receipt'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(err.message || 'Failed to download PDF');
    }
  };

  const openCancelModal = (row) => {
    setCancelRow(row);
    setCancelForm({
      mobile: row.customerPhone || row.customer?.phone || '',
      otp: '',
      cancellationReason: '',
      refundAmount: '0',
    });
    setCancelModalOpen(true);
  };

  const sendCancelOtp = async () => {
    if (!cancelForm.mobile) {
      toast.error('Mobile number is required to send OTP');
      return;
    }
    try {
      setOtpSending(true);
      const res = await customerApi.requestOtp(cancelForm.mobile);
      toast.success(res?.message || 'OTP requested successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setOtpSending(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancelRow) return;
    if (!cancelForm.mobile || !cancelForm.otp) {
      toast.error('Mobile and OTP are required to cancel booking');
      return;
    }
    try {
      setCanceling(true);
      const refundAmount = cancelForm.refundAmount ? Number(cancelForm.refundAmount) : 0;
      const payload = {
        mobile: cancelForm.mobile,
        otp: cancelForm.otp,
        cancellationReason: cancelForm.cancellationReason || undefined,
        refundAmount: refundAmount > 0 ? Math.abs(refundAmount) : 0,
      };
      const rawRes = await bookingApi.cancel(cancelRow.bookingId || cancelRow.booking?.id || cancelRow.id, payload);
      const res = rawRes && rawRes.data ? rawRes.data : rawRes;
      toast.success('Booking cancelled successfully');
      setCancelModalOpen(false);
      setCancelRow(null);
      setCancelForm({ mobile: '', otp: '', cancellationReason: '', refundAmount: '' });
      await refreshBookings();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking');
    } finally {
      setCanceling(false);
    }
  };

  const readyCustomers = customers.filter(c => c.status === "Ready for Booking");
  const cancelledCount = bookings.filter(b => b.status === 'Cancelled').length;
  const activeBookings = bookings.filter(b => b.status !== 'Cancelled');
  const totalRevenue = activeBookings.reduce((a, b) => a + (b.paidAmount || 0), 0);
  const totalPending = activeBookings.reduce((a, b) => a + (b.remainingAmount || 0), 0);

  useEffect(() => {
    const allReceipts = [];
    bookings.forEach(booking => {
      if (booking.receipts && booking.receipts.length > 0) {
        // Sort receipts chronologically to compute running balance
        const sortedReceipts = [...booking.receipts].sort((a, b) => {
          const da = new Date(a.paymentDate || 0);
          const db = new Date(b.paymentDate || 0);
          if (da - db) return da - db;
          return (a.id || 0) - (b.id || 0);
        });
        const plotPrice = Number(booking.plotPrice || 0);
        let cumulativePaid = 0;
        sortedReceipts.forEach(receipt => {
          const currentPayment = Number(receipt.currentPayment || receipt.amount || 0);
          cumulativePaid += currentPayment;
          // Running balance at the time of this receipt
          const runningBalance = booking.status === 'Cancelled' ? 0 : Math.max(0, plotPrice - cumulativePaid);
          allReceipts.push({
            ...receipt,
            customerName: booking.customerName || booking.customer?.name || '',
            projectName: booking.projectName || booking.project?.name || '',
            siteName: booking.siteName || booking.site?.siteNo || booking.site?.name || '',
            customerPhone: booking.customer?.phone || receipt.customerPhone || '',
            mobile: booking.customer?.phone || receipt.mobile || '',
            projectNo: booking.projectNo,
            projectId: booking.projectId ?? booking.project?.id,
            siteId: booking.siteId ?? booking.site?.id,
            status: booking.status,
            notes: booking.notes || receipt.notes || '',
            guardianName: booking.guardianName || receipt.guardianName || '',
            refundAmount: booking.refundAmount ?? 0,
            balance: runningBalance,
            totalPaid: cumulativePaid,
          });
        });
      }
    });
    allReceipts.sort((a, b) => {
      const da = new Date(a.paymentDate || 0);
      const db = new Date(b.paymentDate || 0);
      if (db - da) return db - da;
      return (b.id || 0) - (a.id || 0);
    });
    setReceipts(allReceipts);
  }, [bookings]);

  const fetchCustomerVisits = async (customerId) => {
    try {
      const data = await siteVisit.getByCustomer(customerId);
      const visits = Array.isArray(data) ? data : (data.siteVisits || data.data || []);
      // Filter out visits for sites that already have an active (non-cancelled) booking
      const bookedSiteIds = new Set(
        bookings
          .filter(b => b.status !== 'Cancelled')
          .map(b => String(b.siteId))
      );
      const availableVisits = visits.filter(v => !bookedSiteIds.has(String(v.siteId)));
      setCustomerVisits(availableVisits);
    } catch (err) {
      console.error("Failed to fetch customer visits:", err);
      setCustomerVisits([]);
    }
  };

  const handleCustomerSelect = async (cid) => {
    const c = customers.find(x => x.id === +cid);
    if (c) {
      await fetchCustomerVisits(c.id);
      const existingBooking = bookings.find(b => b.customerId === c.id && b.status !== 'Cancelled' && b.remainingAmount > 0);
      const pricePerSqft = 5000;
      setForm(p => ({
        ...p,
        customerId: c.id,
        customerName: c.name,
        applicantName: c.name,
        guardianName: existingBooking?.guardianName || '',
        relation: "",
        address: c.address || "",
        pinCode: c.pinCode || "",
        mobile: c.mobile || "",
        email: c.email || "",
        salesManagerName: c.salesManagerName,
        pricePerSqft,
        plotPrice: p.plotArea ? p.plotArea * pricePerSqft : ""
      }));
      setFoundCustomer({ ...c, existingBooking: existingBooking || null });
      setMobileSearch(c.mobile || "");
    }
  };

  const handleMobileSearch = async (mobile) => {
    setMobileSearch(mobile);
    if (mobile.length === 10) {
      const c = customers.find(x => x.mobile === mobile);
      if (c) {
        await fetchCustomerVisits(c.id);
        const existingBooking = bookings.find(b => b.customerId === c.id && b.status !== 'Cancelled' && b.remainingAmount > 0);
        setFoundCustomer({ ...c, existingBooking: existingBooking || null });
        const pricePerSqft = 5000;
        setForm(p => ({
          ...p,
          customerId: c.id,
          customerName: c.name,
          applicantName: c.name,
          guardianName: existingBooking?.guardianName || '',
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
      setForm(p => ({ ...p, customerId: "" }));
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
        projectId: Number(form.projectId),
        siteId: Number(form.siteId),
        bookingDate: form.bookingDate,
        guardianName: form.guardianName || '',
        plotArea: Number(form.plotArea),
        pricePerSqft: Number(pricePerSqft),
        plotPrice: Number(plotPrice),
        paidAmount: Number(form.paidAmount),
        remainingAmount: Number(remaining),
        paymentMode: form.paymentMode,
        bankName: form.bankName || undefined,
        chequeNo: form.chequeNo || undefined,
        chequeDate: form.chequeDate || undefined,
        transferId: form.transferId || undefined,
        loanOrOwn: form.loanOrOwn,
        status: form.status,
        assignedTo: form.assignedTo ? Number(form.assignedTo) : undefined,
        assignedToUserName: form.salesManagerName || undefined,
        officeIdNo: form.officeIdNo || undefined,
        notes: form.notes || undefined,
      };
      const rawRes = await bookingApi.create(payload);
      const res = rawRes && rawRes.data ? rawRes.data : rawRes;
      await updateCustomer(+form.customerId, { status: "Booked" });
      await refreshBookings();
      toast.success("Booking registered! WhatsApp notification sent 📱");

      const newReceipt = (res && res.receipts && res.receipts[0]) || {
        receiptNo: res?.receiptNo || `REC-${Date.now()}`,
        currentPayment: Number(form.paidAmount),
        totalPaid: Number(form.paidAmount),
        balance: Number(remaining),
        paymentDate: form.bookingDate,
        paymentMode: form.paymentMode,
        bankName: form.bankName,
        chequeNo: form.chequeNo,
        chequeDate: form.chequeDate,
        transferId: form.transferId,
      };

      return {
        type: 'booking',
        customerName: form.applicantName,
        siteName: form.projectName,
        siteNo: form.siteNo,
        receipt: {
          ...newReceipt,
          customerName: form.applicantName,
          siteName: form.projectName,
          siteNo: form.siteNo,
          projectNo: form.projectNo,
          status: form.status,
        }
      };
    } catch (err) {
      toast.error(err.message || "Failed to create booking");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const handlePayment = async () => {
    if (!form.paidAmount) { toast.error("Enter payment amount"); return; }
    try {
      setSaving(true);
      const amt = +form.paidAmount;
      const rawRes = await bookingApi.createReceipt({
        bookingId: foundCustomer.existingBooking.id,
        amount: amt,
        paymentMode: form.paymentMode,
        bankName: form.bankName,
        chequeNo: form.chequeNo,
        chequeDate: form.chequeDate,
        transferId: form.transferId,
      });
      const res = rawRes && rawRes.data ? rawRes.data : rawRes;
      await updateCustomer(foundCustomer.existingBooking.customerId, { status: "Booked" });
      await refreshBookings();
      toast.success(`Payment of ${formatINR(amt)} recorded! Receipt generated 📄`);

      return {
        type: 'payment',
        customerName: foundCustomer.name || foundCustomer.customerName,
        siteName: foundCustomer.existingBooking.projectName || foundCustomer.existingBooking.siteName,
        siteNo: foundCustomer.existingBooking.site?.siteNo || foundCustomer.existingBooking.siteNo || '',
        receipt: {
          ...res,
          customerName: foundCustomer.name || foundCustomer.customerName,
          siteName: foundCustomer.existingBooking.projectName || foundCustomer.existingBooking.siteName,
          siteNo: foundCustomer.existingBooking.site?.siteNo || foundCustomer.existingBooking.siteNo || '',
          projectNo: foundCustomer.existingBooking.projectNo,
          status: form.status,
        }
      };
    } catch (err) {
      toast.error(err.message || "Failed to record payment");
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const numberToWords = (num) => {
    // Normalize input and guard against invalid values to avoid infinite recursion
    if (typeof num !== 'number') num = Number(num);
    if (!isFinite(num) || isNaN(num)) return '';
    // Work with non-negative integers
    num = Math.floor(Math.abs(num));
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

      const isInitial = row.status === 'Initial Payment' || (!row.previousPaid && !row.balance);
      const isPart = row.status === 'Part Payment' || (row.previousPaid > 0 && row.balance > 0);
      const isFull = row.status === 'Full Payment' || (row.balance === 0);

      const drawnOnBankVal = paymentMode === 'Cash' 
        ? '' 
        : paymentMode === 'Online Transfer' || paymentMode === 'Fund Transfer'
          ? `${row.bankName || 'Online'} ${row.transferId ? '(TXN ID: ' + row.transferId + ')' : ''}`
          : `${row.bankName || ''} ${row.chequeNo ? '(Chq No: ' + row.chequeNo + ')' : ''} ${row.chequeDate ? '(Date: ' + row.chequeDate + ')' : ''}`;

      printWindow.document.write(`
        <html>
        <head>
          <title>Receipt - ${receiptNo}</title>
          <style>
            @page {
              size: A5 landscape;
              margin: 5mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 10px;
              background-color: #f1f5f9;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 95vh;
            }
            .receipt-container {
              border: 2px solid #1e3a8a;
              border-radius: 12px;
              padding: 20px 25px;
              width: 100%;
              max-width: 720px;
              box-sizing: border-box;
              position: relative;
              background: #fff;
              box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
              overflow: hidden;
            }
            .watermark {
              position: absolute;
              top: 55%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 260px;
              height: 260px;
              background-image: url('/metrohomes-icon.png');
              background-size: contain;
              background-repeat: no-repeat;
              background-position: center;
              opacity: 0.06;
              pointer-events: none;
              z-index: 0;
            }
            .content-wrapper {
              position: relative;
              z-index: 10;
            }
            .logo-header {
              display: flex;
              align-items: center;
              margin-bottom: 8px;
            }
            .logo-img {
              width: 90px;
              height: 90px;
              object-fit: contain;
              margin-right: 15px;
            }
            .header-text {
              flex-grow: 1;
              text-align: center;
              margin-right: 85px;
            }
            .company-name {
              font-family: 'Arial Black', Impact, sans-serif;
              font-size: 28px;
              font-weight: 900;
              color: #1e3a8a;
              letter-spacing: 1.5px;
              line-height: 1.1;
            }
            .company-address {
              font-size: 10px;
              font-weight: bold;
              color: #334155;
              margin-top: 4px;
            }
            .title-ack {
              text-align: center;
              color: #dc2626;
              font-weight: bold;
              font-size: 13px;
              text-decoration: underline;
              margin-bottom: 12px;
              letter-spacing: 1px;
            }
            .row-flex {
              display: flex;
              align-items: flex-end;
              margin-bottom: 10px;
              font-size: 12.5px;
              font-weight: bold;
              color: #1e293b;
            }
            .dotted-fill {
              flex-grow: 1;
              border-bottom: 1px dotted #475569;
              margin-left: 8px;
              padding-left: 6px;
              font-family: 'Courier New', Courier, monospace;
              font-size: 14px;
              color: #000;
              min-height: 18px;
              line-height: 18px;
            }
            .checkbox-group {
              display: flex;
              align-items: center;
              margin-bottom: 10px;
              font-size: 12.5px;
              font-weight: bold;
              color: #1e293b;
            }
            .checkbox-item {
              display: inline-flex;
              align-items: center;
              margin-right: 15px;
            }
            .checkbox-box {
              width: 13px;
              height: 13px;
              border: 1.5px solid #1e3a8a;
              display: inline-flex;
              align-items: center;
              justify-content: center;
              margin-right: 5px;
              font-size: 9px;
              background-color: transparent;
              color: #fff;
            }
            .checkbox-box.checked {
              background-color: #1e3a8a;
            }
            .bottom-layout {
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
              margin-top: 15px;
            }
            .amount-container {
              display: flex;
              flex-direction: column;
            }
            .rupee-pill {
              border: 2px solid #0f172a;
              border-radius: 6px;
              padding: 5px 12px;
              display: inline-flex;
              align-items: center;
              min-width: 160px;
              background-color: #f8fafc;
            }
            .rupee-symbol {
              font-size: 20px;
              font-weight: bold;
              margin-right: 10px;
              color: #1e3a8a;
            }
            .rupee-val {
              font-family: 'Courier New', Courier, monospace;
              font-size: 18px;
              font-weight: bold;
              color: #000;
            }
            .realisation-note {
              font-size: 9.5px;
              color: #64748b;
              font-style: italic;
              margin-top: 4px;
            }
            .sign-container {
              text-align: center;
              min-width: 180px;
              margin-bottom: 5px;
            }
            .sign-for {
              font-weight: bold;
              font-size: 13px;
              color: #1e293b;
              margin-bottom: 35px;
            }
            .sign-label {
              font-weight: bold;
              font-size: 11.5px;
              color: #1e293b;
              border-top: 1px solid #94a3b8;
              padding-top: 4px;
            }
            .terms-box {
              border-top: 1px dashed #cbd5e1;
              padding-top: 8px;
              margin-top: 12px;
              font-size: 9.5px;
              color: #475569;
              line-height: 1.35;
            }
            .terms-title {
              font-weight: bold;
              margin-bottom: 2px;
              color: #1e293b;
            }
            .btn-pdf {
              display: block;
              margin: 15px auto 0 auto;
              padding: 8px 24px;
              background: #2563eb;
              color: white;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 13px;
              font-weight: bold;
            }
            .btn-pdf:hover {
              background: #1d4ed8;
            }
            @media print {
              body {
                background-color: transparent;
                padding: 0;
              }
              .receipt-container {
                box-shadow: none;
                border: 2px solid #1e3a8a;
              }
              .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="watermark"></div>
            <div class="content-wrapper">
              
              <!-- Header -->
              <div class="logo-header">
                <img src="/metrohomes-icon.png" class="logo-img" alt="MH Logo" />
                <div class="header-text">
                  <div class="company-name">METRO HOMES</div>
                  <div class="company-address">#557, 17th Cross, 2nd Floor, 2nd Stage, Indiranagar, Bengaluru-560 038</div>
                </div>
              </div>

              <!-- Title -->
              <div class="title-ack">ACKNOWLEDGEMENT</div>

              <!-- No & Date -->
              <div class="row-flex" style="justify-content: space-between; margin-bottom: 8px;">
                <div>
                  No. <span style="color: #dc2626; font-size: 16px; margin-left: 5px; font-family: 'Courier New', Courier, monospace;">${receiptNo}</span>
                </div>
                <div style="display: flex; align-items: flex-end;">
                  Date: <span style="border-bottom: 1px dotted #475569; min-width: 110px; display: inline-block; padding-left: 5px; font-family: 'Courier New', Courier, monospace; font-size: 13px;">${paymentDate}</span>
                </div>
              </div>

              <!-- Received From -->
              <div class="row-flex">
                <span style="white-space: nowrap;">Received from Smt / Sri</span>
                <span class="dotted-fill">${customerName}</span>
              </div>

              <!-- Drawn on Bank -->
              <div class="row-flex">
                <span style="white-space: nowrap;">Drawn on Bank</span>
                <span class="dotted-fill">${drawnOnBankVal || '...................................................................................................'}</span>
              </div>

              <!-- Payment Mode -->
              <div class="checkbox-group">
                <span style="margin-right: 12px;">By</span>
                <span class="checkbox-item">
                  <span class="checkbox-box ${paymentMode === 'Cash' ? 'checked' : ''}">${paymentMode === 'Cash' ? '✓' : ''}</span> Cash
                </span>
                <span class="checkbox-item">
                  <span class="checkbox-box ${paymentMode === 'DD' ? 'checked' : ''}">${paymentMode === 'DD' ? '✓' : ''}</span> DD
                </span>
                <span class="checkbox-item">
                  <span class="checkbox-box ${paymentMode === 'Cheque' ? 'checked' : ''}">${paymentMode === 'Cheque' ? '✓' : ''}</span> Cheque
                </span>
                <span class="checkbox-item">
                  <span class="checkbox-box ${paymentMode === 'Online Transfer' || paymentMode === 'Fund Transfer' ? 'checked' : ''}">${paymentMode === 'Online Transfer' || paymentMode === 'Fund Transfer' ? '✓' : ''}</span> Fund Transfer
                </span>
                <span style="flex-grow: 1; border-bottom: 1px dotted #475569; height: 12px; margin-left: 5px;"></span>
              </div>

              <!-- Towards -->
              <div class="checkbox-group">
                <span style="margin-right: 12px;">Towards</span>
                <span class="checkbox-item">
                  <span class="checkbox-box ${isInitial ? 'checked' : ''}">${isInitial ? '✓' : ''}</span> Initial Payment
                </span>
                <span class="checkbox-item">
                  <span class="checkbox-box ${isPart ? 'checked' : ''}">${isPart ? '✓' : ''}</span> Part Payment
                </span>
                <span class="checkbox-item">
                  <span class="checkbox-box ${isFull ? 'checked' : ''}">${isFull ? '✓' : ''}</span> Full Payment
                </span>
                <span style="flex-grow: 1; border-bottom: 1px dotted #475569; height: 12px; margin-left: 5px;"></span>
              </div>

              <!-- Project Name & Plot # -->
              <div class="row-flex">
                <span style="white-space: nowrap;">Project Name:</span>
                <span class="dotted-fill" style="flex-grow: 0; width: 350px;">${siteName}</span>
               
              </div>

              <!-- Rupees in Words -->
              <div class="row-flex">
                <span style="white-space: nowrap;">Rupees in Words</span>
                <span class="dotted-fill">${rupeesInWords} Only</span>
              </div>

              <!-- Bottom Layout -->
              <div class="bottom-layout">
                <div class="amount-container">
                  <div class="rupee-pill">
                    <span class="rupee-symbol">₹</span>
                    <span class="rupee-val">${formatIndianNumber(currentPayment)}/-</span>
                  </div>
                  <div class="realisation-note">*Cheques subject to realisation</div>
                </div>
                
                <div class="sign-container">
                  <div class="sign-for">For Metro Homes</div>
                  <div class="sign-label">Authorised Signatory</div>
                </div>
              </div>

              <!-- Terms & Conditions -->
              <div class="terms-box">
                <div class="terms-title">Terms & Conditions :</div>
                <div>1. Customer should complete with 25% of plot cost within 10th Day from the Booking date</div>
                <div>2. Regn should be completed within 30 days from the Booking date</div>
                <div>3. Cancellation at any stage will attract a debit of Rs.20,000/- (Twenty Thousand Only) Per plot</div>
              </div>

            </div>
            
            <button class="btn-pdf no-print" onclick="window.print()">Download PDF</button>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => { try { printWindow.print(); } catch(e) {} }, 500);
    }
  };

  const formatCurrency = (value) => formatINR(value);

  const modeColors = {
    "Cash": "bg-green-100 text-green-700",
    "Cheque": "bg-blue-100 text-blue-700",
    "DD": "bg-purple-100 text-purple-700",
    "Online Transfer": "bg-orange-100 text-orange-700",
    "Fund Transfer": "bg-orange-100 text-orange-700",
  };

  const columns = [
    { key: "receiptNo", label: "Receipt No." },
    { key: "bookingId", label: "Booking ID", render: (v) => <span className="font-mono text-xs text-gray-500">{v}</span> },
    { key: "customerName", label: "Customer", render: (v, row) => (<div><div className="font-medium">{v}</div><div className="text-xs text-gray-400">{row.siteName}</div></div>) },
    { key: "projectNo", label: "Project No." },
    { key: "currentPayment", label: "Payment", render: v => <span className="text-blue-600 font-medium">{formatCurrency(v)}</span> },
    { key: "totalPaid", label: "Total Paid", render: v => <span className="text-green-600 font-medium">{formatCurrency(v)}</span> },
    { key: "balance", label: "Balance", render: v => <span className={`font-medium ${v > 0 ? "text-red-500" : "text-green-500"}`}>{formatCurrency(v)}</span> },
    { key: "paymentMode", label: "Mode", render: v => {
      const colorClass = modeColors[v] || "bg-gray-100 text-gray-600";
      return <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${colorClass}`}>{v}</span>;
    } },
    { key: "paymentDate", label: "Payment Date" },
  ];

  const bookingColumns = [
    { key: "bookingId", label: "Booking ID", render: v => <span className="font-mono text-xs text-gray-500">{v}</span> },
    { key: "customerName", label: "Customer Name" },
    { key: "projectName", label: "Project" },
    { key: "siteNo", label: "Site Number" },
    { key: "plotPrice", label: "Total Plot Price", render: v => <span className="text-amber-700 font-medium">{formatCurrency(v)}</span> },
    { key: "totalPaid", label: "Total Paid", render: v => <span className="text-green-600 font-medium">{formatCurrency(v)}</span> },
    { key: "refundAmount", label: "Refund", render: v => <span className={`font-medium ${v > 0 ? 'text-red-500' : 'text-blue-600'}`}>{formatCurrency(v)}</span> },
    { key: "balance", label: "Balance", render: v => <span className={`font-medium ${v > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(v)}</span> },
    { key: "status", label: "Booking Status", render: v => <StatusBadge status={v} /> },
  ];

  const bookingsForTable = [...bookings].map(b => {
    const totalPaid = Array.isArray(b.receipts) ? b.receipts.reduce((s, r) => s + (Number(r.currentPayment || r.amount || 0)), 0) : (b.paidAmount || 0);
    const plotPrice = Number(b.plotPrice || 0);
    const balance = b.status === 'Cancelled' ? 0 : plotPrice - totalPaid;
    return {
      ...b,
      bookingId: b.bookingId || b.id,
      customerName: b.customerName || b.customer?.name || '',
      projectName: b.projectName || b.project?.name || '',
      siteNo: b.siteNo || b.site?.siteNo || '',
      projectId: b.projectId ?? b.project?.id,
      siteId: b.siteId ?? b.site?.id,
      refundAmount: Math.abs(b.refundAmount ?? 0),
      plotPrice,
      totalPaid,
      balance,
    };
  }).sort((a, b) => (b.bookingDate ? new Date(b.bookingDate) - new Date(a.bookingDate) : (b.id || 0) - (a.id || 0)));

  // Filters for table based on selected project/site
  const selectedProjectObj = tableProjectFilter ? sites.find(s => String(s.id) === String(tableProjectFilter)) : null;
  const selectedSiteObj = selectedProjectObj && tableSiteFilter ? (selectedProjectObj.plots || []).find(p => String(p.id) === String(tableSiteFilter)) : null;
  const filteredBookings = bookingsForTable.filter(b => {
    if (selectedProjectObj && String(b.projectId) !== String(selectedProjectObj.id)) return false;
    if (selectedSiteObj && String(b.siteId) !== String(selectedSiteObj.id)) return false;
    if (tableStatusFilter && b.status !== tableStatusFilter) return false;
    return true;
  });

  const filteredReceipts = [...receipts].filter(r => {
    if (selectedProjectObj) {
      const byProjectId = r.projectId && String(r.projectId) === String(selectedProjectObj.id);
      const byProjectNo = r.projectNo && selectedProjectObj.projectNo && String(r.projectNo) === String(selectedProjectObj.projectNo);
      const byProjectName = r.projectName && selectedProjectObj.name && String(r.projectName) === String(selectedProjectObj.name);
      if (!(byProjectId || byProjectNo || byProjectName)) return false;
    }
    if (selectedSiteObj) {
      const bySiteId = r.siteId && String(r.siteId) === String(selectedSiteObj.id);
      const bySiteNo = r.siteNo && selectedSiteObj.siteNo && String(r.siteNo) === String(selectedSiteObj.siteNo);
      if (!(bySiteId || bySiteNo)) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-normal text-gray-900 flex items-center gap-2"><BookOpen size={22} />Booking Management</h1></div>
        <button onClick={() => {
          const today = new Date().toISOString().split("T")[0];
          setForm({ ...empty, bookingDate: today });
          setFoundCustomer(null);
          setMobileSearch("");
          setCustomerVisits([]);
          setModal("add");
        }} className="btn-primary"><Plus size={16} />New Booking</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 lg:gap-4 w-full">
        <StatCard icon={BookOpen} label="Total Bookings" value={bookings.length} color="blue" />
        <StatCard icon={IndianRupee} label="Total Revenue" value={totalRevenue} prefix="₹" color="green" />
        <StatCard icon={AlertCircle} label="Pending Amount" value={totalPending} prefix="₹" color="red" />
        <StatCard icon={XCircle} label="Cancelled Bookings" value={cancelledCount} color="orange" />
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

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center space-x-3">
            <button onClick={() => setActiveTab('bookings')} className={`px-3 py-1 rounded-lg ${activeTab === 'bookings' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-600 hover:bg-gray-50'}`}>Bookings</button>
            <button onClick={() => setActiveTab('receipts')} className={`px-3 py-1 rounded-lg ${activeTab === 'receipts' ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-600 hover:bg-gray-50'}`}>Receipts</button>
          </div>
          <div className="text-sm text-gray-500">Showing: {activeTab === 'bookings' ? 'Bookings' : 'Receipts'}</div>
        </div>

        {activeTab === 'bookings' ? (
          <DataTable
            title="Bookings"
            columns={bookingColumns}
            data={filteredBookings}
            searchKey={["bookingId", "customerName", "siteNo", "projectName"]}
            extraActions={
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <select value={tableProjectFilter} onChange={e => { setTableProjectFilter(e.target.value); setTableSiteFilter(''); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                  <option value="">All projects</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={tableSiteFilter} onChange={e => setTableSiteFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" disabled={!tableProjectFilter}>
                  <option value="">All sites</option>
                  {(sites.find(s => String(s.id) === String(tableProjectFilter))?.plots || []).map(p => <option key={p.id} value={p.id}>{p.siteNo || p.id}</option>)}
                </select>
                <button onClick={() => { setTableProjectFilter(''); setTableSiteFilter(''); setTableStatusFilter(''); setTableSearchResetKey(k => k + 1); }} className="btn-secondary px-4 py-2">Clear</button>
              </div>
            }
            resetSearch={tableSearchResetKey}
            statusOptions={["Initial Payment", "Part Payment", "Full Payment", "Cancelled"]}
            statusFilter={tableStatusFilter}
            onStatusFilterChange={setTableStatusFilter}
            actions={(row) => (
              <>
                <button onClick={() => { setSelected(row); setModal("viewBooking"); }} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg" title="View"><Eye size={15} /></button>
                {row.status !== 'Cancelled' && (
                  <button onClick={() => openCancelModal(row)} className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg" title="Cancel Booking"><XCircle size={15} /></button>
                )}
              </>
            )}
          />
        ) : (
          <DataTable
            title="All Payment Receipts"
            columns={columns}
            data={filteredReceipts}
            searchKey={["customerName", "siteName", "receiptNo", "projectNo"]}
            extraActions={
              <div className="flex flex-col sm:flex-row sm:items-center sm:gap-3">
                <select value={tableProjectFilter} onChange={e => { setTableProjectFilter(e.target.value); setTableSiteFilter(''); }} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100">
                  <option value="">All projects</option>
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
                <select value={tableSiteFilter} onChange={e => setTableSiteFilter(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" disabled={!tableProjectFilter}>
                  <option value="">All sites</option>
                  {(sites.find(s => String(s.id) === String(tableProjectFilter))?.plots || []).map(p => <option key={p.id} value={p.id}>{p.siteNo || p.id}</option>)}
                </select>
                <button onClick={() => { setTableProjectFilter(''); setTableSiteFilter(''); setTableSearchResetKey(k => k + 1); }} className="btn-secondary px-4 py-2">Clear</button>
              </div>
            }
            resetSearch={tableSearchResetKey}
            actions={(row) => (
              <>
                <button onClick={() => { setSelected(row); setModal("view"); }} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg" title="View"><Eye size={15} /></button>
                <button onClick={() => handleDownloadPdf(row)} className="p-1.5 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg" title="Download PDF"><Download size={15} /></button>
                <button onClick={() => { setWhatsappRow(row); setWhatsappModalOpen(true); }} className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg" title="WhatsApp"><MessageSquare size={15} /></button>
              </>
            )}
          />
        )}
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
              <div><label className="label">Booking Date</label><input type="date" value={form.bookingDate} readOnly className="input-field bg-gray-100 cursor-not-allowed" /></div>
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
                      {foundCustomer.existingBooking.siteNo && (
                        <div className="flex justify-between"><span className="text-gray-600">Site No.</span><span className="font-medium text-gray-800">{foundCustomer.existingBooking.siteNo}</span></div>
                      )}
                      <div className="flex justify-between"><span className="text-gray-600">Plot Price</span><span className="font-medium text-gray-800">{formatINR(foundCustomer.existingBooking.plotPrice)}</span></div>
                      <div className="flex justify-between border-t border-amber-200 pt-1.5"><span className="text-gray-600 font-medium">Already Paid</span><span className="font-bold text-green-600">{formatINR(foundCustomer.existingBooking.paidAmount || 0)}</span></div>
                      <div className="flex justify-between"><span className="text-red-600 font-medium">Remaining Balance</span><span className="font-bold text-red-600">{formatINR(foundCustomer.existingBooking.remainingAmount || 0)}</span></div>
                    </div>
                  </div>
                )}

                {customerVisits.length > 0 && !foundCustomer?.existingBooking && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="text-sm font-bold text-blue-900 mb-2 flex items-center gap-2">
                      <Home size={16} />
                      Site Visits ({customerVisits.length})
                    </h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {customerVisits.map((visit, idx) => (
                        <div key={visit.id || idx} className="bg-white rounded-lg p-3 border border-blue-100">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <div className="text-sm font-semibold text-gray-800">
                                {visit.siteName || visit.site?.name || `Visit #${idx + 1}`}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                                <MapPin size={11} />
                                {visit.projectName || visit.project?.name || 'N/A'}
                              </div>
                            </div>
                            <StatusBadge status={visit.status || "Interested"} />
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            {visit.visitDate && (
                              <div>
                                <span className="text-gray-500">Date:</span>
                                <span className="ml-1 font-medium text-gray-700">
                                  {new Date(visit.visitDate).toLocaleDateString("en-IN")}
                                </span>
                              </div>
                            )}
                            {visit.visitTime && (
                              <div>
                                <span className="text-gray-500">Time:</span>
                                <span className="ml-1 font-medium text-gray-700">{visit.visitTime}</span>
                              </div>
                            )}
                            {visit.assignedToUser?.name && (
                              <div>
                                <span className="text-gray-500">Sales Manager:</span>
                                <span className="ml-1 font-medium text-gray-700">{visit.assignedToUser.name}</span>
                              </div>
                            )}
                            {visit.persons && (
                              <div>
                                <span className="text-gray-500">Persons:</span>
                                <span className="ml-1 font-medium text-gray-700">{visit.persons}</span>
                              </div>
                            )}
                          </div>
                          {visit.notes && (
                            <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                              <span className="font-medium">Notes:</span> {visit.notes}
                            </div>
                          )}
                        </div>
                      ))}
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
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-lg p-3 border border-amber-200"><div className="text-xs text-gray-500 mb-1">Project Name</div><div className="text-sm font-medium text-gray-800">{foundCustomer.existingBooking.projectName || 'N/A'}</div></div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200"><div className="text-xs text-gray-500 mb-1">Project No.</div><div className="text-sm font-medium text-gray-800">{foundCustomer.existingBooking.projectNo || (foundCustomer.existingBooking.projectId ? `PRJ-${String(foundCustomer.existingBooking.projectId).padStart(3, '0')}` : 'N/A')}</div></div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200"><div className="text-xs text-gray-500 mb-1">Site No.</div><div className="text-sm font-bold text-blue-700">{foundCustomer.existingBooking.siteNo || 'N/A'}</div></div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200"><div className="text-xs text-gray-500 mb-1">Plot Area</div><div className="text-sm font-medium text-gray-800">{foundCustomer.existingBooking.plotArea ? `${foundCustomer.existingBooking.plotArea} sq.ft` : 'N/A'}</div></div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200"><div className="text-xs text-gray-500 mb-1">Price per sq.ft</div><div className="text-sm font-medium text-gray-800">{formatINR(foundCustomer.existingBooking.pricePerSqft || 0)}</div></div>
                  <div className="bg-white rounded-lg p-3 border border-amber-200"><div className="text-xs text-gray-500 mb-1">Total Plot Price</div><div className="text-sm font-bold text-amber-700">{formatINR(foundCustomer.existingBooking.plotPrice || 0)}</div></div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div><label className="label">Project Name <span className="text-red-500 ml-1">*</span></label>
                  <select value={form.projectId} onChange={e => {
                  const selectedProject = sites.find(s => s.id === +e.target.value);
                    setForm(p => ({ ...p, projectId: e.target.value, siteId: "", siteNo: "", projectName: selectedProject?.name || "", projectNo: selectedProject ? `PRJ-${String(selectedProject.id).padStart(3, '0')}` : "", pricePerSqft: selectedProject?.pricePerSqft || "", location: selectedProject?.location || "" }));
                  }} className="input-field">
                    <option value="">Select project…</option>
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Site No. <span className="text-red-500 ml-1">*</span></label>
                  <select value={form.siteId} onChange={e => {
                    const selectedProject = sites.find(s => s.id === +form.projectId);
                    const selectedPlot = selectedProject?.plots?.find(p => p.id === +e.target.value);
                    const pricePerSqft = selectedPlot?.pricePerSqft || selectedProject?.pricePerSqft || 5000;
                    const area = selectedPlot?.totalSqft || "";
                    const siteNo = selectedPlot?.siteNo || "";
                    setForm(p => ({ ...p, siteId: e.target.value, siteNo, pricePerSqft, plotArea: area, plotPrice: area ? area * pricePerSqft : "" }));
                  }} className="input-field" disabled={!form.projectId}>
                    <option value="">Select site…</option>
                    {(() => {
                      const projectPlots = sites.find(s => s.id === +form.projectId)?.plots || [];
                      const bookedPlotIds = new Set(
                        bookings
                          .filter(b => b.status !== 'Cancelled' && b.projectId === +form.projectId)
                          .map(b => String(b.siteId))
                      );
                      return projectPlots
                        .filter(p => ['Active', 'Available'].includes(p.status) && !bookedPlotIds.has(String(p.id)))
                        .map(p => <option key={p.id} value={p.id}>{p.siteNo} {p.totalSqft ? `(${p.totalSqft} sqft)` : ''}</option>);
                    })()}
                  </select>
                </div>
                {form.siteId && (() => {
                  const selectedProject = sites.find(s => s.id === +form.projectId);
                  const selectedPlot = selectedProject?.plots?.find(p => p.id === +form.siteId);
                  return selectedPlot ? (
                    <div className="bg-white rounded-xl border border-amber-200 overflow-hidden">
                      <div className="px-4 py-2 bg-amber-50 border-b border-amber-200">
                        <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Selected Site Details</h4>
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Site No</th>
                              <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Facing</th>
                              <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">East-West</th>
                              <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">North-South</th>
                              <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Total Sqft</th>
                              <th className="text-left px-3 py-2 text-[10px] font-semibold text-gray-500 uppercase">Price/sqft</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-t border-gray-100">
                              <td className="px-3 py-2 font-bold text-gray-800">{selectedPlot.siteNo}</td>
                              <td className="px-3 py-2">
                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  selectedPlot.facing === "East" ? "bg-amber-50 text-amber-700" :
                                  selectedPlot.facing === "West" ? "bg-indigo-50 text-indigo-700" :
                                  selectedPlot.facing === "North" ? "bg-blue-50 text-blue-700" :
                                  selectedPlot.facing === "South" ? "bg-rose-50 text-rose-700" :
                                  "bg-gray-50 text-gray-600"
                                }`}>{selectedPlot.facing}</span>
                              </td>
                              <td className="px-3 py-2 text-gray-700">{selectedPlot.eastWest ? `${selectedPlot.eastWest} ft` : '-'}</td>
                              <td className="px-3 py-2 text-gray-700">{selectedPlot.northSouth ? `${selectedPlot.northSouth} ft` : '-'}</td>
                              <td className="px-3 py-2 font-medium text-gray-800">{Number(selectedPlot.totalSqft).toLocaleString("en-IN")}</td>
                              <td className="px-3 py-2 font-medium text-gray-800">{formatINR(selectedPlot.pricePerSqft)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : null;
                })()}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="label">Plot Area (sqft) *</label><input type="number" value={form.plotArea} onChange={e => { const area = e.target.value; setForm(p => ({ ...p, plotArea: area, plotPrice: area ? area * (+p.pricePerSqft || 5000) : "" })); }} className="input-field" placeholder="1200" /></div>
                  <div><label className="label">Plot Price (₹) *</label><input type="number" value={form.plotPrice} readOnly className="input-field bg-white border-amber-200 font-medium text-amber-700" placeholder="Auto-calculated" /></div>
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
          {!foundCustomer?.existingBooking && (<button onClick={() => { setForm(empty); setFoundCustomer(null); setMobileSearch(""); setCustomerVisits([]); }} className="btn-secondary flex-1 justify-center py-2.5"><span className="text-orange-600 font-medium">Clear</span></button>)}
          <button onClick={() => { setModal(null); setCustomerVisits([]); }} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
        </div>

        <Modal open={confirmOpen} onClose={() => setConfirmOpen(false)} title={foundCustomer?.existingBooking ? "Confirm Payment" : "Confirm Booking"} size="sm">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{foundCustomer?.existingBooking ? "Are you sure you want to record this payment?" : "Are you sure you want to register this booking?"}</p>
            {foundCustomer?.existingBooking ? (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium">{foundCustomer.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Project</span><span className="font-medium">{foundCustomer.existingBooking.projectName || foundCustomer.existingBooking.siteName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Plot Price</span><span className="font-medium">{formatINR(foundCustomer.existingBooking.plotPrice || 0)}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-500">Previous Paid</span><span className="font-medium text-gray-600">{formatINR(foundCustomer.existingBooking.paidAmount || 0)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Current Payment</span><span className="font-medium text-blue-600">{formatINR(form.paidAmount || 0)}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold"><span>Total Paid</span><span className="text-green-600">{formatINR((foundCustomer.existingBooking.paidAmount || 0) + Number(form.paidAmount || 0))}</span></div>
                <div className="flex justify-between"><span className="text-red-500">Remaining</span><span className="text-red-500">{formatINR((foundCustomer.existingBooking.remainingAmount || 0) - Number(form.paidAmount || 0))}</span></div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium">{form.applicantName || foundCustomer?.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Project</span><span className="font-medium">{form.projectName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Site No.</span><span className="font-medium">{form.siteNo || 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Plot Price</span><span className="font-medium">{formatINR(form.plotPrice || 0)}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-500">Previous Paid</span><span className="font-medium text-gray-600">{formatINR(0)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Today's Payment</span><span className="font-medium text-blue-600">{formatINR(form.paidAmount || 0)}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-bold"><span>Total Paid</span><span className="text-green-600">{formatINR(form.paidAmount || 0)}</span></div>
                <div className="flex justify-between"><span className="text-red-500">Remaining</span><span className="text-red-500">{formatINR(Number(form.plotPrice || 0) - Number(form.paidAmount || 0))}</span></div>
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button onClick={async () => {
                setConfirming(true);
                let successPayload = null;
                try {
                  if (foundCustomer?.existingBooking) {
                    successPayload = await handlePayment();
                  } else {
                    successPayload = await handleBook();
                  }
                  if (successPayload) {
                    setForm(empty);
                    setFoundCustomer(null);
                    setMobileSearch("");
                    setSuccessData(successPayload);
                    setConfirmOpen(false);
                    setModal("success");
                  }
                } finally {
                  setConfirming(false);
                }
              }} disabled={confirming || saving} className="btn-primary flex-1 justify-center py-2.5">
                {confirming || saving ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {foundCustomer?.existingBooking ? "Processing Payment..." : "Processing Booking..."}
                  </>
                ) : (
                  foundCustomer?.existingBooking ? "Confirm Payment" : "Yes, Confirm"
                )}
              </button>
              <button onClick={() => setConfirmOpen(false)} disabled={confirming || saving} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
            </div>
          </div>
        </Modal>
      </Modal>

      {/* Booking View Modal */}
      <Modal open={modal === "viewBooking"} onClose={() => { setModal(null); setSelected(null); }} title="Booking Details" size="md">
        {selected && (
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-500">Booking ID</span><span className="font-medium text-gray-800">{selected.bookingId || selected.id}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium text-gray-800">{selected.customerName || selected.customer?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Project</span><span className="font-medium text-gray-800">{selected.projectName || selected.project?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Site No.</span><span className="font-medium text-gray-800">{selected.siteNo || selected.site?.siteNo}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Plot Price</span><span className="font-medium text-amber-700">{formatCurrency(selected.plotPrice || selected.plotPrice)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Total Paid</span><span className="font-medium text-green-600">{formatCurrency(selected.totalPaid || (selected.paidAmount || 0))}</span></div>
            {selected.status === 'Cancelled' ? (
              <>
                <div className="flex justify-between"><span className="text-gray-500">Refund Amount</span><span className="font-medium text-blue-600">{formatCurrency(selected.refundAmount ?? 0)}</span></div>
                {selected.cancellationReason && (
                  <div className="flex justify-between"><span className="text-gray-500">Cancellation Reason</span><span className="font-medium text-gray-800">{selected.cancellationReason}</span></div>
                )}
              </>
            ) : (
              <div className="flex justify-between"><span className="text-gray-500">Balance</span><span className={`font-medium ${(selected.balance ?? selected.remainingAmount) > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatCurrency(selected.balance ?? selected.remainingAmount ?? 0)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="font-medium"><StatusBadge status={selected.status} /></span></div>

            {Array.isArray(selected.receipts) && selected.receipts.length > 0 && (
              <div className="mt-3  pt-3">
                <div className="text-sm text-gray-500 mb-2">Receipts</div>
                <div className="space-y-2 text-sm">
                  {selected.receipts.map(r => (
                    <div key={r.id || r.receiptNo} className="flex justify-between bg-gray-50 p-2 rounded-lg">
                      <div><div className="font-medium">{r.receiptNo || r.id}</div><div className="text-xs text-gray-500">{r.paymentDate}</div></div>
                      <div className="text-right"><div className="font-medium text-blue-600">{formatCurrency(r.currentPayment || r.amount || 0)}</div><div className="text-xs text-gray-500">{r.paymentMode}</div></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => { setModal(null); setSelected(null); }} className="btn-secondary justify-center py-2.5">Close</button>
            </div>
          </div>
        )}
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
              <span className="text-gray-500">Guardian</span>
              <span className="font-medium text-gray-800">{selected.guardianName || '—'}</span>
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
              <span className="font-semibold text-blue-600">{formatINR(selected.currentPayment)}</span>
            </div>
            <div className="text-sm border-b border-gray-100 pb-3 mb-3 flex justify-between">
              <span className="text-gray-500">Total Paid</span>
              <span className="font-semibold text-green-600">{formatINR(selected.totalPaid)}</span>
            </div>
            <div className="text-sm border-b border-gray-100 pb-3 mb-3 flex justify-between">
              <span className="text-gray-500">Balance</span>
              <span className={`font-semibold ${Number(selected.balance) > 0 ? 'text-red-500' : 'text-green-500'}`}>{formatINR(selected.balance)}</span>
            </div>

            {/* Payment Type / Status */}
            {selected.status && (
              <div className="text-sm border-b border-gray-100 pb-3 mb-3 flex justify-between">
                <span className="text-gray-500">Payment Type</span>
                <span className="font-medium text-gray-800">{selected.status}</span>
              </div>
            )}

            {/* Notes */}
            {selected.notes && (
              <div className="text-sm border-b border-gray-100 pb-3 mb-3">
                <div className="text-gray-500 mb-1">Notes</div>
                <div className="text-gray-800 bg-gray-50 rounded-lg p-2.5 text-xs leading-relaxed">{selected.notes}</div>
              </div>
            )}

            {/* Amount in Words */}
            <p className="text-xs text-gray-400 italic text-center mt-2">
              Rupees {numberToWords(Number(selected.currentPayment))} Only
            </p>

          </div>
        )}
      </Modal>

      {/* WhatsApp Send Confirmation Modal */}
      <Modal open={whatsappModalOpen} onClose={() => { setWhatsappModalOpen(false); setWhatsappRow(null); }} title="Send WhatsApp Receipt" size="sm">
        {whatsappRow && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Send receipt <span className="font-semibold">{whatsappRow.receiptNo}</span> to customer via WhatsApp?</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm border border-gray-100">
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span className="font-medium text-gray-800">{whatsappRow.customerName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Project</span><span className="font-medium text-gray-800">{whatsappRow.siteName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Payment</span><span className="font-medium text-gray-800">{formatINR(whatsappRow.currentPayment || 0)}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-2"><span className="text-gray-500">WhatsApp Number</span><span className="font-mono font-medium text-gray-900">{whatsappRow.customerPhone || whatsappRow.customer?.phone || whatsappRow.phone || whatsappRow.mobile || 'N/A'}</span></div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={async () => {
                try {
                  const res = await bookingApi.sendReceiptWhatsApp(whatsappRow.id);
                  const providerStatus = res?.data?.messages?.[0]?.status || 'sent';
                  toast.success(`WhatsApp receipt sent to ${whatsappRow.customerPhone || whatsappRow.mobile} (status: ${providerStatus})`);
                } catch (err) {
                  toast.error(err.message || "Failed to send WhatsApp");
                } finally {
                  setWhatsappModalOpen(false);
                  setWhatsappRow(null);
                }
              }} className="btn-primary flex-1 justify-center py-2.5">Send</button>
              <button onClick={() => { setWhatsappModalOpen(false); setWhatsappRow(null); }} className="btn-secondary flex-1 justify-center py-2.5">Cancel</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Cancel Booking Modal */}
      <Modal open={cancelModalOpen} onClose={() => { setCancelModalOpen(false); setCancelRow(null); }} title="Cancel Booking" size="sm">
        {cancelRow && (
          <div className="space-y-4">
            <div className="bg-red-50 rounded-xl p-3 border border-red-100 text-sm">
              <div className="flex justify-between mb-1"><span className="text-gray-500">Booking</span><span className="font-medium">{cancelRow.bookingId || cancelRow.id}</span></div>
              <div className="flex justify-between mb-1"><span className="text-gray-500">Customer</span><span className="font-medium">{cancelRow.customerName || cancelRow.customer?.name}</span></div>
              <div className="flex justify-between mb-1"><span className="text-gray-500">Project</span><span className="font-medium">{cancelRow.projectName || cancelRow.project?.name}</span></div>
              <div className="flex justify-between mb-1"><span className="text-gray-500">Site No.</span><span className="font-medium">{cancelRow.siteNo || cancelRow.site?.siteNo}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Paid</span><span className="font-medium text-green-600">{formatCurrency(cancelRow.totalPaid ?? (Array.isArray(cancelRow.receipts) ? cancelRow.receipts.reduce((s, r) => s + (Number(r.currentPayment || r.amount || 0)), 0) : (cancelRow.paidAmount || 0)))}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Refunded</span><span className="font-medium text-blue-600">{formatCurrency(cancelRow.refundAmount ?? 0)}</span></div>
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="label">Mobile number</label>
                <input type="tel" value={cancelForm.mobile} onChange={e => setCancelForm(p => ({ ...p, mobile: e.target.value }))} className="input-field" placeholder="Customer mobile" maxLength={10} />
              </div>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <label className="label">OTP</label>
                  <input type="text" value={cancelForm.otp} onChange={e => setCancelForm(p => ({ ...p, otp: e.target.value }))} className="input-field" placeholder="Enter OTP" maxLength={6} />
                </div>
                <button onClick={sendCancelOtp} disabled={otpSending} className="btn-secondary h-12 mt-6">
                  {otpSending ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
              <div>
                <label className="label">Cancellation Reason</label>
                <textarea value={cancelForm.cancellationReason} onChange={e => setCancelForm(p => ({ ...p, cancellationReason: e.target.value }))} className="input-field h-24 resize-none" placeholder="Reason for cancellation" />
              </div>
              <div>
                <label className="label">Refund Amount (₹)</label>
                <input type="number" value={cancelForm.refundAmount} onChange={e => setCancelForm(p => ({ ...p, refundAmount: e.target.value }))} className="input-field" placeholder="0" min="0" />
                <p className="text-xs text-gray-500 mt-1">Enter the refund amount as a positive value.</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleCancelBooking} disabled={canceling} className="btn-primary flex-1 justify-center py-2.5">
                {canceling ? 'Cancelling...' : 'Confirm Cancel'}
              </button>
              <button onClick={() => { setCancelModalOpen(false); setCancelRow(null); }} disabled={canceling} className="btn-secondary flex-1 justify-center py-2.5">Close</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Success Confirmation Modal */}
      <Modal open={modal === "success"} onClose={() => { setModal(null); setSuccessData(null); }} title="Payment Successful" size="sm">
        {successData && (
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 animate-bounce">
              <CheckCircle size={36} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {successData.type === "booking" ? "Booking Registered!" : "Payment Recorded!"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {successData.type === "booking"
                  ? `Booking for ${successData.customerName} at ${successData.siteName} has been successfully completed.`
                  : `Payment of ${formatINR(successData.receipt?.currentPayment)} from ${successData.customerName} has been successfully recorded.`}
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-1.5 border border-gray-100">
              <div className="flex justify-between"><span className="text-gray-500">Receipt No:</span><span className="font-medium text-gray-800">{successData.receipt?.receiptNo || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Date:</span><span className="font-medium text-gray-800">{successData.receipt?.paymentDate || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Project:</span><span className="font-medium text-gray-800">{successData.siteName || successData.receipt?.siteName || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Site No.:</span><span className="font-medium text-gray-800">{successData.siteNo || successData.receipt?.siteNo || '—'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Amount Paid:</span><span className="font-bold text-green-600">{formatINR(successData.receipt?.currentPayment || successData.receipt?.amount || 0)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Paid:</span><span className="font-bold text-blue-600">{formatINR(successData.receipt?.totalPaid || successData.receipt?.currentPayment || 0)}</span></div>
              <div className="flex justify-between border-t border-gray-200 pt-1.5"><span className="text-gray-500">Remaining Balance:</span><span className="font-bold text-red-500">{formatINR(successData.receipt?.balance || 0)}</span></div>
            </div>

           
          </div>
        )}
      </Modal>
    </div>
  );
}