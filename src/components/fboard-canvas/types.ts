export type Unit = 'mm' | 'cm' | 'in';

export interface LogoData {
  url: string;
  width: number;
  height: number;
}

export interface BoardConfig {
  width: number;
  height: number;
  unit: Unit;
  bleed: number;
  marginTop: number;
  marginRight: number;
  marginBottom: number;
  marginLeft: number;
  marginLinked: boolean;
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: string | number;
  backgroundColor: string;
  textColor: string;
  showGuides: boolean;
  layout: 'text-only' | 'with-logos';
  textAlign: 'left' | 'center' | 'right';
  verticalAlign: 'top' | 'center' | 'bottom';
  leftLogo?: LogoData | null;
  rightLogo?: LogoData | null;
  logoSize: number; // in cm
}

export interface BatchItem extends BoardConfig {
  copies: number;
  companyName: string;
}
