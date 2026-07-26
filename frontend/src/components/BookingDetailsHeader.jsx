import React, { useContext } from 'react';
import { useData } from '../context/DataContext.jsx';

// Importing Google Font (Inter) via CSS-in-JS
const fontLink = document.createElement('link');
fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap';
fontLink.rel = 'stylesheet';
document.head.appendChild(fontLink);

/**
 * BookingDetailsHeader
 *
 * Displays key information for a booking at the top of the booking management view.
 * It shows:
 *   • Customer Master Data (name, phone, email)
 *   • Site‑Visit Data (site name, address, visit date)
 *   • Assigned User Data (name, role)
 *
 * The component uses a premium glass‑morphism style with a subtle gradient
 * background and smooth hover animations to match the rest of the web UI.
 */
export default function BookingDetailsHeader({ booking }) {
  const { customers, sites, users } = useData();

  // Resolve related entities safely – fallback to placeholders if missing.
  const customer = customers.find((c) => c.id === booking.customerId) || {};
  const site = sites.find((s) => s.id === booking.siteId) || {};
  const assignedUser = users.find((u) => u.id === booking.assignedUserId) || {};

  return (
    <div className="booking-header">
      <div className="header-section">
        <h2 className="section-title">Customer</h2>
        <p className="data-item"><strong>Name:</strong> {customer.name || '—'}</p>
        <p className="data-item"><strong>Phone:</strong> {customer.phone || '—'}</p>
        <p className="data-item"><strong>Email:</strong> {customer.email || '—'}</p>
      </div>
      <div className="header-section">
        <h2 className="section-title">Site Visit</h2>
        <p className="data-item"><strong>Site:</strong> {site.name || '—'}</p>
        <p className="data-item"><strong>Address:</strong> {site.address || '—'}</p>
        <p className="data-item"><strong>Visit Date:</strong> {booking.visitDate ? new Date(booking.visitDate).toLocaleDateString() : '—'}</p>
      </div>
      <div className="header-section">
                <h2 className="section-title">Project Details</h2>
        <p className="data-item"><strong>Name:</strong> {booking.projectName || '—'}</p>
        <p className="data-item"><strong>No.:</strong> {booking.projectNo || '—'}</p>
        <p className="data-item"><strong>Plot Area:</strong> {booking.plotArea ? `${booking.plotArea} sq.yd.` : '—'}</p>
        <p className="data-item"><strong>Plot Price:</strong> {booking.plotPrice ? `₹${Number(booking.plotPrice).toLocaleString('en-IN')}` : '—'}</p>
      </div>
      <div className="header-section">
        <h2 className="section-title">Payment Details</h2>
        <p className="data-item"><strong>Paid:</strong> {booking.paidAmount ? `₹${Number(booking.paidAmount).toLocaleString('en-IN')}` : '—'}</p>
        <p className="data-item"><strong>Remaining:</strong> {booking.remainingAmount ? `₹${Number(booking.remainingAmount).toLocaleString('en-IN')}` : '—'}</p>
        <p className="data-item"><strong>Mode:</strong> {booking.paymentMode || '—'}</p>
      </div>

      <div className="header-section">
        <h2 className="section-title">Assigned User</h2>
        <p className="data-item"><strong>Name:</strong> {assignedUser.name || '—'}</p>
        <p className="data-item"><strong>Role:</strong> {assignedUser.role || '—'}</p>
      </div>
      <style jsx>{`
        .booking-header {
          display: flex;
          flex-wrap: wrap;
          gap: 1.5rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, rgba(30,30,30,0.85), rgba(45,45,45,0.85));
          backdrop-filter: blur(8px);
          border-radius: 12px;
          font-family: 'Inter', sans-serif;
          color: #f5f5f5;
        }
        .header-section {
          flex: 1 1 250px;
          min-width: 200px;
          background: rgba(255,255,255,0.08);
          padding: 0.8rem;
          border-radius: 8px;
        }
        .section-title {
          margin: 0 0 0.5rem 0;
          font-size: 1rem;
          font-weight: 600;
          color: #e0eaff;
        }
        .data-item {
          margin: 0.2rem 0;
          font-size: 0.9rem;
          line-height: 1.2;
          color: #d0d0d0;
        }
        .data-item strong {
          color: #ffffff;
        }
        @media (max-width: 768px) {
          .booking-header {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
