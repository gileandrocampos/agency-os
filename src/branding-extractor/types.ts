export type BrandingTheme = 'light' | 'dark' | 'mixed';

export type LogoDetectionStrategy =
  | 'header-image'
  | 'class-logo'
  | 'svg-logo'
  | 'favicon-fallback';

export type IconLibraryName =
  | 'font-awesome'
  | 'bootstrap-icons'
  | 'material-icons'
  | 'lucide'
  | 'heroicons'
  | 'custom-svg'
  | 'unknown';

export type CssFrameworkName =
  | 'bootstrap'
  | 'tailwind'
  | 'bulma'
  | 'foundation'
  | 'materialize'
  | 'custom';

export type FontOrigin =
  | 'system'
  | 'google-fonts'
  | 'adobe-fonts'
  | 'custom-webfont'
  | 'unknown';

export interface LogoCandidate {
  url: string | null;
  selector: string;
  strategy: LogoDetectionStrategy;
  confidence: number;
  width: number;
  height: number;
}

export interface ColorUsage {
  color: string;
  count: number;
}

export interface BrandingPalette {
  primary: string | null;
  secondary: string | null;
  accent: string | null;
  background: string | null;
  surface: string | null;
  text: string | null;
  predominant: ColorUsage[];
  all: string[];
}

export interface FontUsage {
  family: string;
  weights: string[];
  origin: FontOrigin;
  count: number;
}

export interface IconLibraryDetection {
  name: IconLibraryName;
  confidence: number;
  evidence: string[];
}

export interface CssFrameworkDetection {
  name: CssFrameworkName;
  confidence: number;
  evidence: string[];
}

export interface BorderRadiusProfile {
  predominant: string | null;
  values: string[];
}

export interface SpacingProfile {
  predominantMargin: string | null;
  predominantPadding: string | null;
  predominantGap: string | null;
  margins: string[];
  paddings: string[];
  gaps: string[];
}

export interface ComponentCount {
  name: string;
  count: number;
  present: boolean;
}

export interface ButtonClassCount {
  className: string;
  count: number;
}

export interface ButtonStylePattern {
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  count: number;
}

export interface ButtonInsights {
  total: number;
  classFrequency: ButtonClassCount[];
  predominantStyles: ButtonStylePattern[];
  colors: string[];
}

export interface BrandingExtractionResult {
  logo: LogoCandidate | null;
  logoCandidates: LogoCandidate[];
  favicon: string | null;
  palette: BrandingPalette;
  fonts: FontUsage[];
  iconLibrary: {
    primary: IconLibraryDetection;
    detected: IconLibraryDetection[];
  };
  cssFramework: CssFrameworkDetection;
  theme: BrandingTheme;
  borderRadius: BorderRadiusProfile;
  spacing: SpacingProfile;
  components: ComponentCount[];
  buttons: ButtonInsights;
}

export interface BrandingExtractor {
  extract(page: import('playwright').Page): Promise<BrandingExtractionResult>;
}
