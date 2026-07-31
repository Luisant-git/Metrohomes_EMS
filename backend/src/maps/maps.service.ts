import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class MapsService {
  private get apiKey(): string {
    return process.env.GOOGLE_MAPS_API_KEY || 'AIzaSyAfUP27GUuOL0cBm_ROdjE2n6EyVKesIu8';
  }

  async geocodeAddress(address?: string, latlng?: string) {
    try {
      if (!address && !latlng) {
        throw new HttpException('Either address or latlng is required', HttpStatus.BAD_REQUEST);
      }

      let url = `https://maps.googleapis.com/maps/api/geocode/json?key=${this.apiKey}`;
      if (address) {
        url += `&address=${encodeURIComponent(address)}`;
      } else if (latlng) {
        url += `&latlng=${encodeURIComponent(latlng)}`;
      }

      const response = await axios.get<any>(url);
      const data = response.data;

      if (data.status === 'OK' && data.results?.length > 0) {
        const result = data.results[0];
        return {
          success: true,
          formatted_address: result.formatted_address,
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
          place_id: result.place_id,
          results: data.results,
        };
      } else {
        return {
          success: false,
          error: data.error_message || data.status || 'Location not found',
        };
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message || 'Geocoding failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getPlaceAutocomplete(input: string, country = 'in') {
    try {
      if (!input || input.trim().length === 0) {
        return { success: true, suggestions: [] };
      }

      let url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&key=${this.apiKey}`;
      if (country) {
        url += `&components=country:${country}`;
      }

      const response = await axios.get<any>(url);
      const data = response.data;

      if (data.status === 'OK') {
        const suggestions = (data.predictions || []).map((p: any) => ({
          description: p.description,
          place_id: p.place_id,
          main_text: p.structured_formatting?.main_text || p.description,
          secondary_text: p.structured_formatting?.secondary_text || '',
        }));

        return {
          success: true,
          suggestions,
        };
      } else {
        return {
          success: true,
          suggestions: [],
          status: data.status,
          error_message: data.error_message,
        };
      }
    } catch (error) {
      throw new HttpException(error.message || 'Autocomplete failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getDirections(origin: string, destination: string) {
    try {
      if (!origin || !destination) {
        throw new HttpException('Origin and destination are required', HttpStatus.BAD_REQUEST);
      }

      const response = await axios.get<any>(
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&key=${this.apiKey}`
      );
      const data = response.data;

      if (data.status === 'OK') {
        const route = data.routes?.[0];
        const leg = route?.legs?.[0];
        return {
          success: true,
          distance: leg?.distance?.text || '',
          distanceValue: leg?.distance?.value || 0,
          duration: leg?.duration?.text || '',
          durationValue: leg?.duration?.value || 0,
          startAddress: leg?.start_address || '',
          endAddress: leg?.end_address || '',
          routes: data.routes,
        };
      } else {
        return {
          success: false,
          error: data.error_message || 'Route not found',
        };
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message || 'Failed to fetch directions', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async calculateDistance(pickup: string, drop: string) {
    try {
      if (!pickup || !drop) {
        throw new HttpException('Pickup and drop locations are required', HttpStatus.BAD_REQUEST);
      }

      const response = await axios.get<any>(`https://maps.googleapis.com/maps/api/distancematrix/json`, {
        params: {
          origins: pickup,
          destinations: drop,
          key: this.apiKey,
        },
      });

      const data = response.data;
      if (data.rows && data.rows[0]?.elements?.[0]?.status === 'OK') {
        const element = data.rows[0].elements[0];
        return {
          success: true,
          distanceKm: Math.round((element.distance.value / 1000) * 10) / 10,
          durationMins: Math.round(element.duration.value / 60),
          distanceText: element.distance.text,
          durationText: element.duration.text,
          originAddress: data.origin_addresses?.[0] || '',
          destinationAddress: data.destination_addresses?.[0] || '',
        };
      } else {
        return {
          success: false,
          error: 'Unable to calculate distance between locations',
        };
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(error.message || 'Failed to calculate distance', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  getApiKey() {
    return { success: true, key: this.apiKey };
  }
}
