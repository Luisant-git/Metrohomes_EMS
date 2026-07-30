// src/whatsapp/whatsapp.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly accessToken: string;
  private readonly phoneNumberId: string;
  private readonly apiUrl: string = 'https://graph.facebook.com/v17.0';

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN as string;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID as string;
  }

  async sendEmployeeRegistrationSuccess(
    toPhoneNumber: string,
    name: string,
    employeeCode: string,
    role: string,
    referredBy?: string,
  ): Promise<any> {
    const formattedNumber = this.normalizePhone(toPhoneNumber);
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'template',
          template: {
            name: 'employeea_registration_success_v2',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: name },
                  { type: 'text', text: employeeCode },
                  { type: 'text', text: role },
                ],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Employee registration success template sent to ${formattedNumber}`);
      return response.data;
    } catch (error: any) {
      this.logger.error('Error sending employee registration success template', error.response?.data || error.message);
      throw error;
    }
  }

  async sendSiteVisitScheduled(
    toPhoneNumber: string,
    customerName: string,
    siteName: string,
    visitDate: string,
    visitTime: string,
    driverName: string,
    driverMobile: string,
    vehicleNo: string,
  ): Promise<any> {
    const formattedNumber = this.normalizePhone(toPhoneNumber);
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'template',
          template: {
            name: 'site_visit_scheduled_v2',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: this.sanitizeText(customerName) },
                  { type: 'text', text: this.sanitizeText(siteName) },
                  { type: 'text', text: this.sanitizeText(visitDate) },
                  { type: 'text', text: this.sanitizeText(visitTime) },
                  { type: 'text', text: this.sanitizeText(driverName, 'Not Assigned') },
                  { type: 'text', text: this.sanitizeText(driverMobile) },
                  { type: 'text', text: this.sanitizeText(vehicleNo) },
                ],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Site visit scheduled template sent to ${formattedNumber}`);
      return response.data;
    } catch (error: any) {
      this.logger.error('Error sending site visit scheduled template', error.response?.data || error.message);
      throw error;
    }
  }

  async sendCustomerSiteVisitConfirmation(
    toPhoneNumber: string,
    salesManagerName: string,
    customerName: string,
    customerMobile: string,
    siteName: string,
    visitDate: string,
    visitTime: string,
    driverName: string,
    driverMobile: string,
    vehicleNo: string,
  ): Promise<any> {
    const formattedNumber = this.normalizePhone(toPhoneNumber);
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'template',
          template: {
            name: 'customer_site_visit_confirmation',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: this.sanitizeText(salesManagerName, 'Sales Manager') },
                  { type: 'text', text: this.sanitizeText(customerName) },
                  { type: 'text', text: this.sanitizeText(customerMobile) },
                  { type: 'text', text: this.sanitizeText(siteName) },
                  { type: 'text', text: this.sanitizeText(visitDate) },
                  { type: 'text', text: this.sanitizeText(visitTime) },
                  { type: 'text', text: this.sanitizeText(driverName, 'Not Assigned') },
                  { type: 'text', text: this.sanitizeText(driverMobile) },
                  { type: 'text', text: this.sanitizeText(vehicleNo) },
                ],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`Customer site visit confirmation template sent to ${formattedNumber}`);
      return response.data;
    } catch (error: any) {
      this.logger.error('Error sending customer site visit confirmation template', error.response?.data || error.message);
      throw error;
    }
  }

  async sendPlotBookingReceipt(
    toPhoneNumber: string,
    customerName: string,
    pdfUrl: string,
  ): Promise<any> {
    const formattedNumber = this.normalizePhone(toPhoneNumber);
    const payload = {
      messaging_product: 'whatsapp',
      to: formattedNumber,
      type: 'template',
      template: {
        name: 'plot_booking_receipt_v1',
        language: { code: 'en' },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'document',
                document: { link: pdfUrl, filename: 'Booking_Receipt.pdf' },
              },
            ],
          },
          {
            type: 'body',
            parameters: [{ type: 'text', text: this.sanitizeText(customerName, 'Customer') }],
          },
        ],
      },
    };
    return this.sendTemplate('plot_booking_receipt_v1', formattedNumber, payload);
  }

  async sendPaymentReceipt(
    toPhoneNumber: string,
    customerName: string,
    pdfUrl: string,
  ): Promise<any> {
    const formattedNumber = this.normalizePhone(toPhoneNumber);
    const payload = {
      messaging_product: 'whatsapp',
      to: formattedNumber,
      type: 'template',
      template: {
        name: 'payment_receipt',
        language: { code: 'en' },
        components: [
          {
            type: 'header',
            parameters: [
              {
                type: 'document',
                document: { link: pdfUrl, filename: 'Payment_Receipt.pdf' },
              },
            ],
          },
          {
            type: 'body',
            parameters: [{ type: 'text', text: this.sanitizeText(customerName, 'Customer') }],
          },
        ],
      },
    };
    return this.sendTemplate('payment_receipt', formattedNumber, payload);
  }

  private sanitizeText(val: any, defaultVal = 'N/A'): string {
    if (val === null || val === undefined) return defaultVal;
    const str = String(val).trim();
    return str.length > 0 ? str : defaultVal;
  }

  async sendTemplate(templateName: string, formattedNumber: string, payload: any): Promise<any> {
    try {
      const response = await axios.post<any>(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data || {};
      const messages = (data as any).messages || [];
      const messageId = messages[0]?.id;
      const status = messages[0]?.status || 'accepted';
      this.logger.log(`WhatsApp template "${templateName}" accepted for ${formattedNumber} | messageId=${messageId} status=${status}`);
      return data;
    } catch (error: any) {
      const apiMessage = error.response?.data?.error?.message || error.message;
      const apiStatus = error.response?.data?.error?.error_user_title || String(error.response?.status || '');
      this.logger.error(`Error sending WhatsApp template "${templateName}" to ${formattedNumber}: ${apiStatus} - ${apiMessage}`);
      throw new Error(`WhatsApp send failed: ${apiStatus}`);
    }
  }

  private normalizePhone(toPhoneNumber: string): string {
    const trimmed = toPhoneNumber.trim();
    if (/^\d{10}$/.test(trimmed)) {
      return `91${trimmed}`;
    }
    return trimmed;
  }

  // Send OTP via WhatsApp using metrohomes_verification_code_v1 template
  async sendOtp(toPhoneNumber: string, otp: string): Promise<any> {
    const formattedNumber = this.normalizePhone(toPhoneNumber);
    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'template',
          template: {
            name: 'metrohomes_verification_code_v1',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: otp }],
              },
              {
                type: 'button',
                sub_type: 'url',
                index: 0,
                parameters: [{ type: 'text', text: otp }],
              },
            ],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`OTP template sent to ${formattedNumber}`);
      return response.data;
    } catch (error: any) {
      this.logger.error('Error sending OTP template', error.response?.data || error.message);
      throw error;
    }
  }
}