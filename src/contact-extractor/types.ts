export type ContactConfidence = 'high' | 'medium' | 'low';

export interface PhoneContact {
  raw: string;
  normalized: string;
  source: 'href' | 'text';
  confidence: ContactConfidence;
}

export interface WhatsAppContact {
  url: string;
  phone: string | null;
  source: 'href' | 'text';
  confidence: ContactConfidence;
}

export interface EmailContact {
  email: string;
  source: 'href' | 'text';
  confidence: ContactConfidence;
}

export interface AddressContact {
  text: string;
  source: 'schema' | 'footer' | 'contact-section' | 'map';
  confidence: ContactConfidence;
}

export type SocialPlatform =
  | 'instagram'
  | 'facebook'
  | 'linkedin'
  | 'tiktok'
  | 'youtube'
  | 'pinterest'
  | 'x'
  | 'threads'
  | 'behance'
  | 'github';

export interface SocialProfile {
  platform: SocialPlatform;
  url: string;
  handle: string | null;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapReference {
  url: string;
  source: 'href' | 'iframe' | 'script';
  coordinates: Coordinates | null;
}

export interface BusinessHour {
  text: string;
  source: 'schema' | 'text';
}

export interface ContactFormSummary {
  action: string | null;
  method: 'GET' | 'POST' | 'UNKNOWN';
  requiredFields: number;
  fieldNames: string[];
  hasCaptcha: boolean;
}

export interface ContactCta {
  text: string;
  href: string | null;
}

export interface BranchOffice {
  name: string | null;
  address: string | null;
  phones: string[];
  emails: string[];
}

export interface ContactExtractionResult {
  phones: PhoneContact[];
  whatsapp: WhatsAppContact[];
  emails: EmailContact[];
  addresses: AddressContact[];
  socialProfiles: SocialProfile[];
  maps: MapReference[];
  businessHours: BusinessHour[];
  forms: ContactFormSummary[];
  ctas: ContactCta[];
  branches: BranchOffice[];
}

export interface ContactExtractorInput {
  html: string;
  baseUrl?: string;
}
