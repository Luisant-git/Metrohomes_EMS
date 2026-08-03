import { Injectable, Logger } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

export interface BookingReceiptData {
  receiptNo: string;
  bookingDate: string;
  customerName: string;
  customerPhone: string;
  siteName: string;
  projectName: string;
  plotArea: number;
  pricePerSqft: number;
  plotPrice: number;
  paidAmount: number;
  remainingAmount: number;
  paymentMode: string;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  transferId?: string;
  isInitial: boolean;
  isPart: boolean;
  isFull: boolean;
}

export interface PaymentReceiptData {
  receiptNo: string;
  paymentDate: string;
  customerName: string;
  customerPhone: string;
  siteName: string;
  projectName: string;
  previousPaid: number;
  currentPayment: number;
  totalPaid: number;
  balance: number;
  paymentMode: string;
  bankName?: string;
  chequeNo?: string;
  chequeDate?: string;
  transferId?: string;
  isInitial: boolean;
  isPart: boolean;
  isFull: boolean;
}

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);
  private readonly uploadDir = './uploads';

  constructor() {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private formatIndianNumber(num: number): string {
    if (num === null || num === undefined || isNaN(num)) return '0';
    const isNegative = num < 0;
    const absNum = Math.abs(Math.round(num));
    const numStr = String(absNum);
    let formatted: string;
    if (numStr.length <= 3) {
      formatted = numStr;
    } else {
      const last3 = numStr.slice(-3);
      const rest = numStr.slice(0, -3);
      const restFormatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',');
      formatted = restFormatted + ',' + last3;
    }
    return (isNegative ? '-' : '') + formatted;
  }

  private numberToWords(num: number): string {
    if (num === 0) return 'Zero';
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + this.numberToWords(num % 100) : '');
    if (num < 100000) return this.numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + this.numberToWords(num % 1000) : '');
    if (num < 10000000) return this.numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + this.numberToWords(num % 100000) : '');
    return this.numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + this.numberToWords(num % 10000000) : '');
  }

  private drawCheckbox(doc: any, x: number, y: number, size: number, checked: boolean, label: string) {
    doc.rect(x, y, size, size).lineWidth(1).stroke('#1e3a8a');
    if (checked) {
      doc.fillColor('#1e3a8a').rect(x, y, size, size).fill();
      // Draw vector tick mark
      const pad = size * 0.18;
      doc.save()
        .moveTo(x + pad, y + size * 0.52)
        .lineTo(x + size * 0.42, y + size - pad)
        .lineTo(x + size - pad, y + pad)
        .lineWidth(1.5)
        .strokeColor('#ffffff')
        .stroke()
        .restore();
    }
    doc.fillColor('#1e293b').fontSize(9).font('Helvetica').text(label, x + size + 5, y + 1);
  }

  private loadLogo(doc: PDFDocument): any | null {
    const logoPath = path.join(process.cwd(), 'public', 'metrohomes-icon.png');
    try {
      if (fs.existsSync(logoPath)) {
        const img = doc.openImage(logoPath);
        if (img) {
          this.logger.log(`Logo loaded from ${logoPath}`);
          return img;
        }
      } else {
        this.logger.warn(`Logo not found at ${logoPath}`);
      }
    } catch (e) {
      this.logger.error('Failed to load logo', e);
    }
    return null;
  }

  private drawWatermark(doc: PDFDocument, pageWidth: number, pageHeight: number, logoImg: any) {
    if (!logoImg) return;
    const size = 160;
    const x = pageWidth / 2 - size / 2;
    const y = pageHeight / 2 - size / 2;
    doc.save();
    doc.opacity(0.08);
    doc.image(logoImg, x, y, { width: size, height: size });
    doc.opacity(1);
    doc.restore();
  }

  async generateBookingReceipt(data: BookingReceiptData): Promise<string> {
    const filename = `booking_receipt_${data.receiptNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const filePath = path.join(this.uploadDir, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A5',
          layout: 'landscape',
          margin: 15,
        });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const pageWidth = 595.28;
        const margin = 15;
        const contentWidth = pageWidth - margin * 2;
        const pageHeight = 420;
        const signX = pageWidth - margin - 178;

        doc.rect(margin, margin, contentWidth, pageHeight - margin * 2).lineWidth(2).stroke('#1e3a8a');

        const logoImg = this.loadLogo(doc);
        this.drawWatermark(doc, pageWidth, pageHeight, logoImg);

        const logoBlockSize = 75;
        const logoBlockX = margin + 12;
        const logoBlockY = margin + 14;
        if (logoImg) {
          doc.image(logoImg, logoBlockX, logoBlockY, { width: logoBlockSize, height: logoBlockSize });
        } else {
          doc.roundedRect(logoBlockX, logoBlockY, logoBlockSize, logoBlockSize, 6).fillColor('#1e3a8a').fill();
          doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text('METRO', logoBlockX, logoBlockY + 12, { width: logoBlockSize, align: 'center' });
          doc.fillColor('#f59e0b').fontSize(18).font('Helvetica-Bold').text('MH', logoBlockX, logoBlockY + 24, { width: logoBlockSize, align: 'center' });
          doc.fillColor('#ffffff').fontSize(7).font('Helvetica').text('HOMES', logoBlockX, logoBlockY + 42, { width: logoBlockSize, align: 'center' });
        }

        const hdrX = logoBlockX + logoBlockSize + 14;
        const hdrW = contentWidth - logoBlockSize - 32;
        let yPos = margin + 18;
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e3a8a').text('METRO HOMES', hdrX, yPos, { width: hdrW, align: 'center' });
        doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text('#557, 17th Cross, 2nd Floor, 2nd Stage, Indiranagar, Bengaluru-560 038', hdrX, yPos + 32, { width: hdrW, align: 'center' });

        yPos = margin + 90;
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#dc2626').text('ACKNOWLEDGEMENT', margin + 10, yPos, { align: 'center', underline: true });
        yPos += 20;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text('No. ', margin + 12, yPos);
        doc.fillColor('#dc2626').fontSize(13).font('Courier-Bold').text(data.receiptNo, margin + 36, yPos - 1);

        const dateRightX = pageWidth - margin - 162;
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Date: ', dateRightX, yPos);
        doc.fillColor('#000000').fontSize(10).font('Courier').text(data.bookingDate, dateRightX + 36, yPos);
        doc.moveTo(dateRightX + 36, yPos + 12).lineTo(pageWidth - margin - 12, yPos + 12).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        yPos += 20;

        const rcvLabel = 'Received from Smt / Sri';
        const rcvLabelEnd = margin + 12 + doc.widthOfString(rcvLabel);
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(rcvLabel, margin + 12, yPos);
        const rcvFillX = rcvLabelEnd +7;
        const rcvFillW = pageWidth - margin - rcvFillX - 12;
        doc.moveTo(rcvFillX, yPos + 11).lineTo(rcvFillX + rcvFillW, yPos + 11).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        doc.fillColor('#000000').fontSize(12).font('Courier-Bold').text(data.customerName, rcvFillX + 4, yPos - 1, { width: rcvFillW - 8 });
        yPos += 18;

        const bankLabel = 'Drawn on Bank';
        const bankLabelEnd = margin + 12 + doc.widthOfString(bankLabel);
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(bankLabel, margin + 12, yPos);
        let drawnOnText = '';
        if (data.paymentMode === 'Cash') {
          drawnOnText = '';
        } else if (data.paymentMode === 'Online Transfer' || data.paymentMode === 'Fund Transfer') {
          drawnOnText = `${data.bankName || 'Online'} ${data.transferId ? '(TXN ID: ' + data.transferId + ')' : ''}`;
        } else {
          drawnOnText = `${data.bankName || ''} ${data.chequeNo ? '(Chq No: ' + data.chequeNo + ')' : ''} ${data.chequeDate ? '(Date: ' + data.chequeDate + ')' : ''}`;
        }
        const bankFillX = bankLabelEnd + 7;
        const bankFillW = pageWidth - margin - bankFillX - 12;
        doc.moveTo(bankFillX, yPos + 11).lineTo(bankFillX + bankFillW, yPos + 11).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        if (drawnOnText) {
          doc.fillColor('#000000').fontSize(10).font('Courier').text(drawnOnText, bankFillX + 4, yPos, { width: bankFillW - 8 });
        }
        yPos += 18;

        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('By', margin + 12, yPos);
        let cbX = margin + 32;
        const cbSize = 11;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.paymentMode === 'Cash', 'Cash'); cbX += 62;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.paymentMode === 'DD', 'DD'); cbX += 50;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.paymentMode === 'Cheque', 'Cheque'); cbX += 72;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.paymentMode === 'Online Transfer' || data.paymentMode === 'Fund Transfer', 'Fund Transfer');
        const afterByX = cbX + 90;
        doc.moveTo(afterByX, yPos + 9).lineTo(pageWidth - margin - 12, yPos + 9).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        yPos += 18;

        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Towards', margin + 12, yPos);
        cbX = margin + 62;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.isInitial, 'Initial Payment'); cbX += 105;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.isPart, 'Part Payment'); cbX += 95;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.isFull, 'Full Payment');
        const afterTowardsX = cbX + 85;
        doc.moveTo(afterTowardsX, yPos + 9).lineTo(pageWidth - margin - 12, yPos + 9).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        yPos += 18;

        const projLabel = 'Project Name:';
        const projLabelEnd = margin + 12 + doc.widthOfString(projLabel);
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(projLabel, margin + 12, yPos);
        const projFillX = projLabelEnd + 7;
        const projFillW = pageWidth - margin - projFillX - 12;
        doc.moveTo(projFillX, yPos + 11).lineTo(projFillX + projFillW, yPos + 11).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        doc.fillColor('#000').fontSize(10).font('Courier-Bold').text(data.siteName, projFillX + 4, yPos, { width: projFillW - 8 });
        yPos += 18;

        const rupeesInWords = this.numberToWords(data.paidAmount) + ' Only';
        const wordsLabel = 'Rupees in Words';
        const wordsLabelEnd = margin + 12 + doc.widthOfString(wordsLabel);
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(wordsLabel, margin + 12, yPos);
        const wordsFillX = wordsLabelEnd + 7;
        const wordsFillW = pageWidth - margin - wordsFillX - 12;
        doc.moveTo(wordsFillX, yPos + 11).lineTo(wordsFillX + wordsFillW, yPos + 11).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        doc.fillColor('#000').fontSize(10).font('Courier').text(rupeesInWords, wordsFillX + 4, yPos + 1, { width: wordsFillW - 8 });
        yPos += 26;

        doc.roundedRect(margin + 12, yPos, 215, 32, 6).lineWidth(2).stroke('#0f172a');
        doc.fillColor('#f8fafc').roundedRect(margin + 13, yPos + 1, 213, 30, 5).fill();
        doc.fillColor('#1e3a8a').fontSize(13).font('Helvetica-Bold').text('Rs.', margin + 20, yPos + 10);
        doc.fillColor('#000').fontSize(15).font('Courier-Bold').text(`${this.formatIndianNumber(data.paidAmount)}/-`, margin + 46, yPos + 8);

        doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('For Metro Homes', signX, yPos + 2, { width: 165, align: 'center' });
        yPos += 22;
        doc.moveTo(signX + 10, yPos + 4).lineTo(signX + 155, yPos + 4).lineWidth(0.5).strokeColor('#94a3b8').stroke();
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Authorised Signatory', signX, yPos + 7, { width: 165, align: 'center' });
        yPos += 28;

        doc.moveTo(margin + 12, yPos).lineTo(pageWidth - margin - 12, yPos).dash(3, { space: 3 }).strokeColor('#cbd5e1').lineWidth(0.8).stroke().undash();
        yPos += 8;
        doc.fillColor('#1e293b').fontSize(8).font('Helvetica-Bold').text('Terms & Conditions :', margin + 12, yPos);
        yPos += 11;
        doc.fillColor('#475569').fontSize(7.5).font('Helvetica');
        doc.text('1. Customer should complete with 25% of plot cost within 10th Day from the Booking date', margin + 12, yPos); yPos += 10;
        doc.text('2. Regn should be completed within 30 days from the Booking date', margin + 12, yPos); yPos += 10;
        doc.text('3. Cancellation at any stage will attract a debit of Rs.20,000/- (Twenty Thousand Only) Per plot', margin + 12, yPos);

        doc.end();

        stream.on('finish', () => {
          this.logger.log(`Booking receipt PDF generated: ${filename}`);
          resolve(filename);
        });

        stream.on('error', (err) => {
          this.logger.error('Error writing booking receipt PDF', err);
          reject(err);
        });
      } catch (error) {
        this.logger.error('Error generating booking receipt PDF', error);
        reject(error);
      }
    });
  }

  async generatePaymentReceipt(data: PaymentReceiptData): Promise<string> {
    const filename = `payment_receipt_${data.receiptNo.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
    const filePath = path.join(this.uploadDir, filename);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A5',
          layout: 'landscape',
          margin: 15,
        });
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        const pageWidth = 595.28;
        const margin = 15;
        const contentWidth = pageWidth - margin * 2;
        const pageHeight = 420;
        const signX = pageWidth - margin - 178;

        doc.rect(margin, margin, contentWidth, pageHeight - margin * 2).lineWidth(2).stroke('#1e3a8a');

        const logoImg = this.loadLogo(doc);
        this.drawWatermark(doc, pageWidth, pageHeight, logoImg);

        const logoBlockSize = 75;
        const logoBlockX = margin + 12;
        const logoBlockY = margin + 14;
        if (logoImg) {
          doc.image(logoImg, logoBlockX, logoBlockY, { width: logoBlockSize, height: logoBlockSize });
        } else {
          doc.roundedRect(logoBlockX, logoBlockY, logoBlockSize, logoBlockSize, 6).fillColor('#1e3a8a').fill();
          doc.fillColor('#ffffff').fontSize(7).font('Helvetica-Bold').text('METRO', logoBlockX, logoBlockY + 12, { width: logoBlockSize, align: 'center' });
          doc.fillColor('#f59e0b').fontSize(18).font('Helvetica-Bold').text('MH', logoBlockX, logoBlockY + 24, { width: logoBlockSize, align: 'center' });
          doc.fillColor('#ffffff').fontSize(7).font('Helvetica').text('HOMES', logoBlockX, logoBlockY + 42, { width: logoBlockSize, align: 'center' });
        }

        const hdrX = logoBlockX + logoBlockSize + 14;
        const hdrW = contentWidth - logoBlockSize - 32;
        let yPos = margin + 18;
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#1e3a8a').text('METRO HOMES', hdrX, yPos, { width: hdrW, align: 'center' });
        doc.fontSize(8.5).font('Helvetica').fillColor('#334155').text('#557, 17th Cross, 2nd Floor, 2nd Stage, Indiranagar, Bengaluru-560 038', hdrX, yPos + 32, { width: hdrW, align: 'center' });

        yPos = margin + 90;
        doc.fontSize(12).font('Helvetica-Bold').fillColor('#dc2626').text('ACKNOWLEDGEMENT', margin + 10, yPos, { align: 'center', underline: true });
        yPos += 20;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#1e293b').text('No. ', margin + 12, yPos);
        doc.fillColor('#dc2626').fontSize(13).font('Courier-Bold').text(data.receiptNo, margin + 36, yPos - 1);

        const dateRightX = pageWidth - margin - 162;
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Date: ', dateRightX, yPos);
        doc.fillColor('#000000').fontSize(10).font('Courier').text(data.paymentDate, dateRightX + 36, yPos);
        doc.moveTo(dateRightX + 36, yPos + 12).lineTo(pageWidth - margin - 12, yPos + 12).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        yPos += 20;

        const rcvLabel = 'Received from Smt / Sri';
        const rcvLabelEnd = margin + 12 + doc.widthOfString(rcvLabel);
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(rcvLabel, margin + 12, yPos);
        const rcvFillX = rcvLabelEnd + 7;
        const rcvFillW = pageWidth - margin - rcvFillX - 12;
        doc.moveTo(rcvFillX, yPos + 11).lineTo(rcvFillX + rcvFillW, yPos + 11).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        doc.fillColor('#000000').fontSize(12).font('Courier-Bold').text(data.customerName, rcvFillX + 4, yPos - 1, { width: rcvFillW - 8 });
        yPos += 18;

        const bankLabel = 'Drawn on Bank';
        const bankLabelEnd = margin + 12 + doc.widthOfString(bankLabel);
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(bankLabel, margin + 12, yPos);
        let drawnOnText = '';
        if (data.paymentMode === 'Cash') {
          drawnOnText = '';
        } else if (data.paymentMode === 'Online Transfer' || data.paymentMode === 'Fund Transfer') {
          drawnOnText = `${data.bankName || 'Online'} ${data.transferId ? '(TXN ID: ' + data.transferId + ')' : ''}`;
        } else {
          drawnOnText = `${data.bankName || ''} ${data.chequeNo ? '(Chq No: ' + data.chequeNo + ')' : ''} ${data.chequeDate ? '(Date: ' + data.chequeDate + ')' : ''}`;
        }
        const bankFillX = bankLabelEnd + 7;
        const bankFillW = pageWidth - margin - bankFillX - 12;
        doc.moveTo(bankFillX, yPos + 11).lineTo(bankFillX + bankFillW, yPos + 11).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        if (drawnOnText) {
          doc.fillColor('#000000').fontSize(10).font('Courier').text(drawnOnText, bankFillX + 4, yPos, { width: bankFillW - 8 });
        }
        yPos += 18;

        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('By', margin + 12, yPos);
        let cbX = margin + 32;
        const cbSize = 11;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.paymentMode === 'Cash', 'Cash'); cbX += 62;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.paymentMode === 'DD', 'DD'); cbX += 50;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.paymentMode === 'Cheque', 'Cheque'); cbX += 72;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.paymentMode === 'Online Transfer' || data.paymentMode === 'Fund Transfer', 'Fund Transfer');
        const afterByX = cbX + 90;
        doc.moveTo(afterByX, yPos + 9).lineTo(pageWidth - margin - 12, yPos + 9).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        yPos += 18;

        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Towards', margin + 12, yPos);
        cbX = margin + 62;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.isInitial, 'Initial Payment'); cbX += 105;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.isPart, 'Part Payment'); cbX += 95;
        this.drawCheckbox(doc, cbX, yPos, cbSize, data.isFull, 'Full Payment');
        const afterTowardsX = cbX + 85;
        doc.moveTo(afterTowardsX, yPos + 9).lineTo(pageWidth - margin - 12, yPos + 9).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        yPos += 18;

        const projLabel = 'Project Name:';
        const projLabelEnd = margin + 12 + doc.widthOfString(projLabel);
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(projLabel, margin + 12, yPos);
        const projFillX = projLabelEnd + 7;
        const projFillW = pageWidth - margin - projFillX - 12;
        doc.moveTo(projFillX, yPos + 11).lineTo(projFillX + projFillW, yPos + 11).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        doc.fillColor('#000').fontSize(10).font('Courier-Bold').text(data.siteName, projFillX + 4, yPos, { width: projFillW - 8 });
        yPos += 18;

        const rupeesInWords = this.numberToWords(data.currentPayment) + ' Only';
        const wordsLabel = 'Rupees in Words';
        const wordsLabelEnd = margin + 12 + doc.widthOfString(wordsLabel);
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text(wordsLabel, margin + 12, yPos);
        const wordsFillX = wordsLabelEnd + 7;
        const wordsFillW = pageWidth - margin - wordsFillX - 12;
        doc.moveTo(wordsFillX, yPos + 11).lineTo(wordsFillX + wordsFillW, yPos + 11).dash(1.5, { space: 2 }).strokeColor('#475569').lineWidth(0.5).stroke().undash();
        doc.fillColor('#000').fontSize(9.5).font('Courier').text(rupeesInWords, wordsFillX + 4, yPos + 1, { width: wordsFillW - 8 });
        yPos += 26;

        doc.roundedRect(margin + 12, yPos, 215, 32, 6).lineWidth(2).stroke('#0f172a');
        doc.fillColor('#f8fafc').roundedRect(margin + 13, yPos + 1, 213, 30, 5).fill();
        doc.fillColor('#1e3a8a').fontSize(13).font('Helvetica-Bold').text('Rs.', margin + 20, yPos + 10);
        doc.fillColor('#000').fontSize(15).font('Courier-Bold').text(`${this.formatIndianNumber(data.currentPayment)}/-`, margin + 46, yPos + 8);

        doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('For Metro Homes', signX, yPos + 2, { width: 165, align: 'center' });
        yPos += 22;
        doc.moveTo(signX + 10, yPos + 4).lineTo(signX + 155, yPos + 4).lineWidth(0.5).strokeColor('#94a3b8').stroke();
        doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('Authorised Signatory', signX, yPos + 7, { width: 165, align: 'center' });
        yPos += 28;

        doc.moveTo(margin + 12, yPos).lineTo(pageWidth - margin - 12, yPos).dash(3, { space: 3 }).strokeColor('#cbd5e1').lineWidth(0.8).stroke().undash();
        yPos += 8;
        doc.fillColor('#1e293b').fontSize(8).font('Helvetica-Bold').text('Terms & Conditions :', margin + 12, yPos);
        yPos += 11;
        doc.fillColor('#475569').fontSize(7.5).font('Helvetica');
        doc.text('1. Customer should complete with 25% of plot cost within 10th Day from the Booking date', margin + 12, yPos); yPos += 10;
        doc.text('2. Regn should be completed within 30 days from the Booking date', margin + 12, yPos); yPos += 10;
        doc.text('3. Cancellation at any stage will attract a debit of Rs.20,000/- (Twenty Thousand Only) Per plot', margin + 12, yPos);

        doc.end();

        stream.on('finish', () => {
          this.logger.log(`Payment receipt PDF generated: ${filename}`);
          resolve(filename);
        });

        stream.on('error', (err) => {
          this.logger.error('Error writing payment receipt PDF', err);
          reject(err);
        });
      } catch (error) {
        this.logger.error('Error generating payment receipt PDF', error);
        reject(error);
      }
    });
  }

  getPdfPath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  getPdfUrl(filename: string): string {
    const uploadUrl = process.env.UPLOAD_URL;
    const sanitizedBase = (uploadUrl || '').replace(/\/+$/, '');
    return `${sanitizedBase}/${filename}`;
  }
}