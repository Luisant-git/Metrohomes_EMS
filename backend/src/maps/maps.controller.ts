import { Controller, Get, Query } from '@nestjs/common';
import { MapsService } from './maps.service';

@Controller('maps')
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get('geocode')
  async geocode(
    @Query('address') address?: string,
    @Query('latlng') latlng?: string,
  ) {
    return this.mapsService.geocodeAddress(address, latlng);
  }

  @Get('autocomplete')
  async autocomplete(
    @Query('input') input: string,
    @Query('country') country?: string,
  ) {
    return this.mapsService.getPlaceAutocomplete(input, country);
  }

  @Get('directions')
  async directions(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
  ) {
    return this.mapsService.getDirections(origin, destination);
  }

  @Get('distance')
  async distance(
    @Query('pickup') pickup?: string,
    @Query('drop') drop?: string,
    @Query('origin') origin?: string,
    @Query('destination') destination?: string,
  ) {
    const originLoc = pickup || origin;
    const destLoc = drop || destination;
    return this.mapsService.calculateDistance(originLoc, destLoc);
  }

  @Get('api-key')
  async getApiKey() {
    return this.mapsService.getApiKey();
  }
}
