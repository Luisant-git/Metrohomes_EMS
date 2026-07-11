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
   * Template Name: employeea_registration_success
   * Parameters:
   *   1 - Name
   *   2 - Employee Code (User ID)
   *   3 - Role
   *   4 - Referred By
   */
  async sendEmployeeRegistrationSuccess(
    toPhoneNumber: string,
    name: string,
    employeeCode: string,
    role: string,
    referredBy: string,
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
            name: 'employeea_registration_success',
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
                    text: employeeCode, // {{2}} - Employee Code
                  },
                  {
                    type: 'text',
                    text: role, // {{3}} - Role
                  },
                  {
                    type: 'text',
                    text: referredBy, // {{4}} - Referred By
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
}