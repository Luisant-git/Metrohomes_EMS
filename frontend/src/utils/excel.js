import * as XLSX from "xlsx";

function toDate(value) {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function num(value) {
  const n = Number(value);
  return isNaN(n) ? 0 : n;
}

export function exportBookingToExcel(b, { filename } = {}) {
  const customerName = b.customerName || b.customer?.name || "";
  const projectName = b.projectName || b.project?.name || "";
  const siteNo = b.siteNo || b.site?.siteNo || "";

  const totalPaid = num(
    b.totalPaid ??
    (Array.isArray(b.receipts)
      ? b.receipts.reduce((s, r) => s + num(r.currentPayment || r.amount), 0)
      : (b.paidAmount || 0))
  );
  const plotPrice = num(b.plotPrice);
  const balance = b.status === "Cancelled" ? 0 : num(b.balance ?? (plotPrice - totalPaid));

  const fields = [
    { label: "Booking ID", value: b.bookingId || b.id || "" },
    { label: "Booking Date", value: toDate(b.bookingDate) },
    { label: "Customer Name", value: customerName },
    { label: "Guardian Name", value: b.guardianName || "" },
    { label: "Mobile", value: b.customer?.phone || b.mobile || "" },
    { label: "Email", value: b.customer?.email || b.email || "" },
    { label: "Project", value: projectName },
    { label: "Project No.", value: b.projectNo || "" },
    { label: "Site Number", value: siteNo },
    { label: "Plot Area (sq.ft)", value: b.plotArea || "" },
    { label: "Price per sq.ft", value: num(b.pricePerSqft) },
    { label: "Total Plot Price", value: plotPrice },
    { label: "Total Paid", value: totalPaid },
    { label: "Balance", value: balance },
    { label: "Status", value: b.status || "" },
    { label: "Payment Mode", value: b.paymentMode || "" },
    { label: "Bank Name", value: b.bankName || "" },
    { label: "Cheque No.", value: b.chequeNo || "" },
    { label: "Cheque Date", value: toDate(b.chequeDate) },
    { label: "Transfer ID", value: b.transferId || "" },
    { label: "Loan / Own Fund", value: b.loanOrOwn || "" },
    { label: "Sales Manager", value: b.salesManagerName || b.assignedToUser?.name || "" },
    { label: "Office ID No.", value: b.officeIdNo || "" },
    { label: "Notes", value: b.notes || "" },
    ...(b.status === "Cancelled"
      ? [
          { label: "Refund Amount", value: num(b.refundAmount) },
          { label: "Cancellation Reason", value: b.cancellationReason || "" },
        ]
      : []),
  ];

  const wb = XLSX.utils.book_new();

  const ws = XLSX.utils.aoa_to_sheet([fields.map((f) => f.label), fields.map((f) => f.value)]);
  ws["!cols"] = fields.map(() => ({ wch: 20 }));
  XLSX.utils.book_append_sheet(wb, ws, "Booking Details");

  const receipts =
    Array.isArray(b.receipts) && b.receipts.length
      ? b.receipts
      : b.receipt
        ? [b.receipt]
        : [];

  if (receipts.length) {
    const rows = [
      ["Receipt No", "Payment Date", "Payment Mode", "Bank", "Cheque/DD No", "Transfer ID", "Previous Paid", "Current Payment", "Total Paid", "Balance"],
      ...receipts.map((r) => [
        r.receiptNo || "",
        toDate(r.paymentDate),
        r.paymentMode || "",
        r.bankName || "",
        r.chequeNo || "",
        r.transferId || "",
        num(r.previousPaid),
        num(r.currentPayment || r.amount),
        num(r.totalPaid),
        num(r.balance),
      ]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(rows);
    ws2["!cols"] = [{ wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 16 }, { wch: 14 }, { wch: 14 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Receipts");
  }

  XLSX.writeFile(wb, filename || `${b.bookingId || b.id || "booking"}.xlsx`);
}

export function exportUsersToExcel(users, { filename, referredBy = () => "" } = {}) {
  const header = ["S.No", "User ID", "Name", "Designation", "Employment Type", "Mobile", "Email", "Referred By", "Status"];
  const rows = [
    header,
    ...users.map((u, i) => [
      i + 1,
      u.employeeCode || "",
      u.name || "",
      u.role || "",
      u.jobType || "",
      u.mobile || "",
      u.email || "",
      referredBy(u) || "",
      u.status || "",
    ]),
  ];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 6 }, { wch: 14 }, { wch: 24 }, { wch: 18 },
    { wch: 16 }, { wch: 14 }, { wch: 30 }, { wch: 24 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Users");
  XLSX.writeFile(wb, filename || "Metrohomes_Users_List.xlsx");
}
