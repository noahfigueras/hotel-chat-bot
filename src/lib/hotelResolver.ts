import fs from "fs";
import path from "path";

export interface HotelSocials {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  website?: string;
}

export interface HotelConfig {
  id: string;
  name: string;
  whatsappPhoneNumber: string;
  metaPhoneNumberId: string;
  location: string;
  phone: string;
  socials: HotelSocials;
  amenities: string[];
  language: string;
  pictureFolder: string;
  bookingWebsites?: string[];
  checkIn?: string;
  checkOut?: string;
}

export class HotelResolver {
  private hotels: Map<string, HotelConfig> = new Map();
  private hotelFolders: Map<string, string> = new Map();

  constructor(hotelsBasePath: string) {
    this.loadHotels(hotelsBasePath);
  }

  private loadHotels(hotelsBasePath: string): void {
    if (!fs.existsSync(hotelsBasePath)) {
      console.error(`Hotels directory not found: ${hotelsBasePath}`);
      return;
    }

    const hotelFolders = fs.readdirSync(hotelsBasePath);

    for (const folder of hotelFolders) {
      const hotelJsonPath = path.join(hotelsBasePath, folder, "hotel.json");

      if (fs.existsSync(hotelJsonPath)) {
        const hotelData = JSON.parse(fs.readFileSync(hotelJsonPath, "utf-8"));
        const normalizedPhone = this.normalizePhoneNumber(
          hotelData.whatsappPhoneNumber
        );

        this.hotels.set(normalizedPhone, hotelData);
        this.hotelFolders.set(normalizedPhone, path.join(hotelsBasePath, folder));

        console.log(
          `Loaded hotel: ${hotelData.name} (${normalizedPhone})`
        );
      }
    }
  }

  private normalizePhoneNumber(phone: string): string {
    return phone.replace(/\D/g, "");
  }

  getHotelByPhoneNumber(phoneNumber: string): HotelConfig | null {
    const normalized = this.normalizePhoneNumber(phoneNumber);
    return this.hotels.get(normalized) || null;
  }

  getHotelFolder(phoneNumber: string): string | null {
    const normalized = this.normalizePhoneNumber(phoneNumber);
    return this.hotelFolders.get(normalized) || null;
  }

  getAllHotels(): HotelConfig[] {
    return Array.from(this.hotels.values());
  }
}
