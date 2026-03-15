import { Unit } from './types';

export const unitToPx = (value: number, unit: Unit, dpi = 300): number => {
  switch (unit) {
    case 'in':
      return value * dpi;
    case 'cm':
      return (value / 2.54) * dpi;
    case 'mm':
      return (value / 25.4) * dpi;
    default:
      return value;
  }
};

export const pxToUnit = (value: number, unit: Unit, dpi = 300): number => {
  switch (unit) {
    case 'in':
      return value / dpi;
    case 'cm':
      return (value / dpi) * 2.54;
    case 'mm':
      return (value / dpi) * 25.4;
    default:
      return value;
  }
};

export const unitToPt = (value: number, unit: Unit): number => {
  // 1 inch = 72 pt
  switch (unit) {
    case 'in':
      return value * 72;
    case 'cm':
      return (value / 2.54) * 72;
    case 'mm':
      return (value / 25.4) * 72;
    default:
      return value;
  }
};
