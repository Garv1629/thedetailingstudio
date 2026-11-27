import {
  INTERIOR_ADDON_PRICE,
  MAIN_SERVICE_CATEGORIES,
  PACKAGES,
  WRAP_ADDON_PRICE,
  type PackageId,
  type SectionId,
  type ServiceCategoryId,
  type WrapColourId,
} from '../data/atelierData';

export interface BookingFormValues {
  fullName: string;
  email: string;
  phone: string;
  vehicle: string;
  mainServiceId: ServiceCategoryId;
  subService: string;
  packageId: PackageId;
  preferredDate: string;
  timeSlot: string;
  includeColourWrap: boolean;
  wrapColourId: WrapColourId;
  includeInteriorDetail: boolean;
  includePickupDrop: boolean;
  notes: string;
}

export interface BookingValidationErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  vehicle?: string;
  preferredDate?: string;
  timeSlot?: string;
  subService?: string;
}

export interface EstimateBreakdown {
  basePrice: number;
  wrapAddon: number;
  interiorAddon: number;
  totalPrice: number;
  estimatedDaysLabel: string;
}

export interface ConfirmedBooking {
  reference: string;
  createdAt: string;
  createdAtIso?: string;
  values: BookingFormValues;
  estimate: EstimateBreakdown;
}

export function getSubServicesForCategory(
  categoryId: ServiceCategoryId,
): string[] {
  const category = MAIN_SERVICE_CATEGORIES.find((c) => c.id === categoryId);
  return category ? category.subServices : MAIN_SERVICE_CATEGORIES[0].subServices;
}

export function getCategoryTitle(categoryId: ServiceCategoryId): string {
  const category = MAIN_SERVICE_CATEGORIES.find((c) => c.id === categoryId);
  return category ? category.title : MAIN_SERVICE_CATEGORIES[0].title;
}

export function calculateEstimate(
  packageId: PackageId,
  includeColourWrap: boolean,
  includeInteriorDetail: boolean,
): EstimateBreakdown {
  const pkg = PACKAGES.find((p) => p.id === packageId) ?? PACKAGES[0];
  const wrapAddon = includeColourWrap ? WRAP_ADDON_PRICE : 0;
  // Signature package already includes full interior detailing
  const interiorAddon =
    includeInteriorDetail && pkg.id !== 'signature' ? INTERIOR_ADDON_PRICE : 0;

  const extraDays = includeColourWrap ? 2 : 0;
  const minDays = pkg.minDays + extraDays;
  const maxDays = pkg.maxDays + extraDays;
  const estimatedDaysLabel =
    minDays === maxDays ? `${minDays} days` : `${minDays}–${maxDays} days`;

  return {
    basePrice: pkg.price,
    wrapAddon,
    interiorAddon,
    totalPrice: pkg.price + wrapAddon + interiorAddon,
    estimatedDaysLabel,
  };
}

export function validateBookingForm(
  values: Pick<
    BookingFormValues,
    | 'fullName'
    | 'email'
    | 'phone'
    | 'vehicle'
    | 'preferredDate'
    | 'timeSlot'
    | 'subService'
  >,
): BookingValidationErrors {
  const errors: BookingValidationErrors = {};

  if (!values.fullName.trim() || values.fullName.trim().length < 2) {
    errors.fullName = 'Please enter your full name.';
  }

  const emailTrimmed = values.email.trim();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailTrimmed || !emailPattern.test(emailTrimmed)) {
    errors.email = 'Please enter a valid email address.';
  }

  const digitsOnly = values.phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    errors.phone = 'Please enter a valid 10-digit mobile number.';
  }

  if (!values.vehicle.trim() || values.vehicle.trim().length < 3) {
    errors.vehicle = 'Please include your vehicle make and model.';
  }

  if (!values.subService.trim()) {
    errors.subService = 'Please select a sub-service.';
  }

  if (!values.preferredDate.trim()) {
    errors.preferredDate = 'Please select a preferred inspection date.';
  }

  if (!values.timeSlot.trim()) {
    errors.timeSlot = 'Please choose an inspection time slot.';
  }

  return errors;
}

export function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatBookingReference(
  dateStr: string,
  seedNumber: number,
): string {
  const cleanDate = dateStr.replace(/\D/g, '').slice(-4) || '0000';
  const code = String((Math.abs(seedNumber) % 9000) + 1000);
  return `TDS-${cleanDate}-${code}`;
}

export function computeActiveSection(
  scrollY: number,
  sections: Array<{ id: SectionId; top: number; height: number }>,
  viewportHeight: number,
): SectionId {
  if (sections.length === 0) return 'top';
  const anchorY = scrollY + viewportHeight * 0.42;

  let active: SectionId = sections[0].id;
  for (const sec of sections) {
    if (anchorY >= sec.top) {
      active = sec.id;
    }
  }
  return active;
}

export function clampPercent(value: number): number {
  if (Number.isNaN(value)) return 50;
  return Math.min(100, Math.max(0, Math.round(value)));
}
