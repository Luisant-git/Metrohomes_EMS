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

  /**
   * Send Employee Registration Success Template
   * Template Name: employeea_registration_success_v2
   * Parameters:
   *   1 - Name
   *   2 - Employee Code (User ID)
   *   3 - Role
   */
  async sendEmployeeRegistrationSuccess(
    toPhoneNumber: string,
    name: string,
    employeeCode: string,
    role: string,
    referredBy?: string,
  ): Promise<any> {
    // Add 91 if it's a 10 digit number and doesn't start with country code
    let formattedNumber = toPhoneNumber.trim();
    if (/^\d{10}$/.test(formattedNumber)) {
      formattedNumber = `91${formattedNumber}`;
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'template',
          template: {
            name: 'employeea_registration_success_v2',
            language: {
              code: 'en',
            },
            components: [
              {
                type: 'body',
                parameters: [
                  {
                    type: 'text',
                    text: name, // {{1}} - Name
                  },
                  {
                    type: 'text',
                    text: employeeCode, // {{2}} - Employee Code (User ID)
                  },
                  {
                    type: 'text',
                    text: role, // {{3}} - Role
                  },
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

      this.logger.log(
        `Employee registration success template sent to ${formattedNumber}`,
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Error sending employee registration success template',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  /**
   * Send Site Visit Scheduled Template
   * Template Name: site_visit_scheduled
   * Parameters:
   *   1 - Customer Name
   *   2 - Site Name
   *   3 - Driver Name
   *   4 - Driver Mobile
   *   5 - Vehicle No
   */
  async sendSiteVisitScheduled(
    toPhoneNumber: string,
    customerName: string,
    siteName: string,
    driverName: string,
    driverMobile: string,
    vehicleNo: string,
  ): Promise<any> {
    let formattedNumber = toPhoneNumber.trim();
    if (/^\d{10}$/.test(formattedNumber)) {
      formattedNumber = `91${formattedNumber}`;
    }

    try {
      const response = await axios.post(
        `${this.apiUrl}/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: formattedNumber,
          type: 'template',
          template: {
            name: 'site_visit_scheduled',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [
                  { type: 'text', text: customerName }, // {{1}} - Customer Name
                  { type: 'text', text: siteName },      // {{2}} - Site Name
                  { type: 'text', text: driverName },    // {{3}} - Driver Name
                  { type: 'text', text: driverMobile },  // {{4}} - Driver Mobile
                  { type: 'text', text: vehicleNo },     // {{5}} - Vehicle No
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
      this.logger.error(
        'Error sending site visit scheduled template',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  /**
   * Send Customer Site Visit Confirmation Template (to the employee/creator)
   * Template Name: customer_site_visit_confirmation
   * Parameters:
   *   1 - Sales Manager Name (employee who created the customer)
   *   2 - Customer Name
   *   3 - Customer Mobile
   *   4 - Site Name
   *   5 - Visit Date
   *   6 - Visit Time
   *   7 - Driver Name
   *   8 - Driver Mobile
   *   9 - Vehicle No
   */
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
    let formattedNumber = toPhoneNumber.trim();
    if (/^\d{10}$/.test(formattedNumber)) {
      formattedNumber = `91${formattedNumber}`;
    }

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
                  { type: 'text', text: salesManagerName }, // {{1}} - Sales Manager Name
                  { type: 'text', text: customerName },      // {{2}} - Customer Name
                  { type: 'text', text: customerMobile },    // {{3}} - Customer Mobile
                  { type: 'text', text: siteName },          // {{4}} - Site Name
                  { type: 'text', text: visitDate },         // {{5}} - Visit Date
                  { type: 'text', text: visitTime },         // {{6}} - Visit Time
                  { type: 'text', text: driverName },        // {{7}} - Driver Name
                  { type: 'text', text: driverMobile },      // {{8}} - Driver Mobile
                  { type: 'text', text: vehicleNo },         // {{9}} - Vehicle No
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
      this.logger.error(
        'Error sending customer site visit confirmation template',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  // Send OTP via WhatsApp using metrohomes_verification_code_v1 template
  async sendOtp(toPhoneNumber: string, otp: string): Promise<any> {
    let formattedNumber = toPhoneNumber.trim();
    if (/^\d{10}$/.test(formattedNumber)) {
      formattedNumber = `91${formattedNumber}`;
    }
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
                  parameters: [
                    {
                      type: 'text',
                      text: otp, // {{1}} - OTP
                    },
                  ],
                },
                {
                  type: 'button',
                  sub_type: 'url',
                  index: 0,
                  parameters: [
                    { type: 'text', text: otp },
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
      this.logger.log(`OTP template sent to ${formattedNumber}`);
      return response.data;
    } catch (error: any) {
      this.logger.error('Error sending OTP template', error.response?.data || error.message);
      throw error;
    }
  }
}