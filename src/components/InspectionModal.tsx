import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import {
  INSPECTION_SLOTS,
  STUDIO_INFO,
  type PackageId,
  type ServiceCategoryId,
  type WrapColourId,
} from '../data/atelierData';
import {
  calculateEstimate,
  formatBookingReference,
  getSubServicesForCategory,
  validateBookingForm,
  type BookingFormValues,
  type BookingValidationErrors,
  type ConfirmedBooking,
} from '../utils/bookingLogic';

interface InspectionModalProps {
  isOpen: boolean;
  initialPackageId: PackageId;
  initialMainServiceId: ServiceCategoryId;
  initialSubService: string;
  initialIncludeWrap: boolean;
  initialWrapColourId: WrapColourId;
  onClose: () => void;
  onBookingConfirmed: (booking: ConfirmedBooking) => void;
}

function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDefaultInspectionDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  return date.toISOString().split('T')[0];
}

function computeUniqueReferenceSeed(
  fullName: string,
  vehicle: string,
  totalPrice: number,
): number {
  let hash = totalPrice;
  const combined = `${fullName.trim()}|${vehicle.trim()}`;
  for (let i = 0; i < combined.length; i += 1) {
    hash = (hash * 31 + combined.charCodeAt(i)) % 1_000_000;
  }
  return Math.abs(hash + (Date.now() % 8999));
}

export function InspectionModal({
  isOpen,
  initialPackageId,
  initialMainServiceId,
  initialSubService,
  initialIncludeWrap,
  initialWrapColourId,
  onClose,
  onBookingConfirmed,
}: InspectionModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousActiveRef = useRef<HTMLElement | null>(null);
  const submittingRef = useRef(false);
  const [formValues, setFormValues] = useState<BookingFormValues>({
    fullName: '',
    email: '',
    phone: '',
    vehicle: '',
    mainServiceId: initialMainServiceId,
    subService: initialSubService,
    packageId: initialPackageId,
    preferredDate: getDefaultInspectionDate(),
    timeSlot: INSPECTION_SLOTS[1],
    includeColourWrap: initialIncludeWrap,
    wrapColourId: initialWrapColourId,
    includeInteriorDetail: false,
    includePickupDrop: false,
    notes: '',
  });
  const [errors, setErrors] = useState<BookingValidationErrors>({});
  const [confirmed, setConfirmed] = useState<ConfirmedBooking | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    submittingRef.current = false;
    setConfirmed(null);
    setErrors({});
    const validSubs = getSubServicesForCategory(initialMainServiceId);
    const resolvedSub = validSubs.includes(initialSubService)
      ? initialSubService
      : validSubs[0];

    setFormValues((prev) => ({
      ...prev,
      packageId: initialPackageId,
      mainServiceId: initialMainServiceId,
      subService: resolvedSub,
      includeColourWrap: initialIncludeWrap,
      wrapColourId: initialWrapColourId,
    }));
  }, [
    isOpen,
    initialPackageId,
    initialMainServiceId,
    initialSubService,
    initialIncludeWrap,
    initialWrapColourId,
  ]);

  useEffect(() => {
    if (!isOpen) return;
    previousActiveRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 30);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const estimate = calculateEstimate(
    formValues.packageId,
    formValues.includeColourWrap,
    formValues.includeInteriorDetail,
  );

  const updateField = <K extends keyof BookingFormValues>(
    field: K,
    value: BookingFormValues[K],
  ) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;

    const validationErrors = validateBookingForm(formValues);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstInvalidFieldId: Record<string, string> = {
        fullName: 'booking-full-name',
        email: 'booking-email',
        phone: 'booking-phone',
        vehicle: 'booking-vehicle',
        preferredDate: 'booking-date',
        timeSlot: 'booking-slot',
      };
      const firstKey = Object.keys(validationErrors)[0];
      const fieldId = firstKey ? firstInvalidFieldId[firstKey] : undefined;
      if (fieldId) {
        document.getElementById(fieldId)?.focus();
      }
      return;
    }

    submittingRef.current = true;
    const now = new Date();
    const reference = formatBookingReference(
      formValues.preferredDate,
      computeUniqueReferenceSeed(
        formValues.fullName,
        formValues.vehicle,
        estimate.totalPrice,
      ),
    );
    const booking: ConfirmedBooking = {
      reference,
      createdAt: now.toLocaleTimeString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
      }),
      createdAtIso: now.toISOString(),
      values: {
        ...formValues,
        fullName: formValues.fullName.trim(),
        email: formValues.email.trim(),
        phone: formValues.phone.trim(),
        vehicle: formValues.vehicle.trim(),
      },
      estimate,
    };

    setConfirmed(booking);
    onBookingConfirmed(booking);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#060607]/68 backdrop-blur-lg overflow-y-auto"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-modal-title"
        className="glass-surface-elevated relative w-full max-w-2xl my-auto rounded-2xl text-[#ECE8DF] max-h-[92svh] sm:max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 sm:gap-4 border-b border-[#ECE8DF]/14 bg-[#0A0A0E]/78 px-4 py-4 sm:px-6 sm:py-5 backdrop-blur-xl">
          <div>
            <p className="font-mono-atelier text-[11px] tracking-[0.14em] uppercase text-[#A6A299]">
              {STUDIO_INFO.brandName} · Zeta I, Greater Noida · {STUDIO_INFO.phoneDisplay}
            </p>
            <h2
              id="booking-modal-title"
              className="mt-1 font-editorial text-[28px] sm:text-[32px] font-medium tracking-[-0.01em] leading-tight text-[#ECE8DF]"
            >
              {confirmed ? 'Inspection slot reserved.' : 'Request an inspection slot.'}
            </h2>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close booking dialog"
            className="inline-flex items-center justify-center w-11 h-11 rounded-full border border-[#ECE8DF]/16 text-[#C9C5BC] hover:text-[#ECE8DF] hover:border-[#ECE8DF]/40 transition-colors shrink-0"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Confirmed Receipt State */}
        {confirmed ? (
          <div className="p-6 sm:p-8 space-y-6" data-testid="booking-confirmation">
            <div className="glass-surface flex items-start gap-4 rounded-xl p-5">
              <CheckCircle2
                className="w-6 h-6 text-[#ECE8DF] shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <div className="space-y-1">
                <p className="text-base font-semibold text-[#ECE8DF]">
                  Your studio appointment is confirmed for{' '}
                  {confirmed.values.preferredDate} at {confirmed.values.timeSlot}.
                </p>
                <p className="text-sm text-[#C9C5BC]">
                  Bring your {confirmed.values.vehicle} to {STUDIO_INFO.shortAddress}
                  {confirmed.values.includePickupDrop
                    ? ' (or our driver will confirm Pickup & Drop timing).'
                    : '.'}
                </p>
              </div>
            </div>

            <dl className="glass-surface grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-xl p-5 text-sm">
              <div>
                <dt className="font-mono-atelier text-[11px] uppercase tracking-[0.1em] text-[#A6A299]">
                  Reference
                </dt>
                <dd className="mt-1 font-mono-atelier text-base font-medium text-[#ECE8DF]">
                  {confirmed.reference}
                </dd>
              </div>
              <div>
                <dt className="font-mono-atelier text-[11px] uppercase tracking-[0.1em] text-[#A6A299]">
                  Client
                </dt>
                <dd className="mt-1 text-[#ECE8DF]">{confirmed.values.fullName}</dd>
              </div>
              <div>
                <dt className="font-mono-atelier text-[11px] uppercase tracking-[0.1em] text-[#A6A299]">
                  Vehicle
                </dt>
                <dd className="mt-1 text-[#ECE8DF]">{confirmed.values.vehicle}</dd>
              </div>
              <div>
                <dt className="font-mono-atelier text-[11px] uppercase tracking-[0.1em] text-[#A6A299]">
                  Studio Slot
                </dt>
                <dd className="mt-1 font-mono-atelier text-sm text-[#ECE8DF]">
                  {confirmed.values.preferredDate} · {confirmed.values.timeSlot}
                </dd>
              </div>
            </dl>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  submittingRef.current = false;
                  setConfirmed(null);
                }}
                className="px-5 py-3 rounded-full border border-[#ECE8DF]/20 text-sm font-medium text-[#ECE8DF] hover:bg-[#ECE8DF]/8 transition-colors min-h-[44px]"
              >
                Book another vehicle
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-full bg-[#ECE8DF] text-[#060607] text-sm font-semibold hover:bg-white transition-colors min-h-[44px]"
              >
                Return to studio
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} noValidate className="p-4 sm:p-8 space-y-5 sm:space-y-6">
            {/* Contact & Vehicle Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="booking-full-name"
                  className="block text-xs font-medium text-[#D4D0C7] mb-1.5"
                >
                  Full name <span aria-hidden="true">*</span>
                </label>
                <input
                  id="booking-full-name"
                  type="text"
                  autoComplete="name"
                  required
                  value={formValues.fullName}
                  onChange={(e) => updateField('fullName', e.target.value)}
                  aria-invalid={Boolean(errors.fullName)}
                  aria-describedby={errors.fullName ? 'error-full-name' : undefined}
                  placeholder="Aarav Sharma"
                  className="glass-input w-full rounded-xl px-4 py-3 text-sm text-[#ECE8DF] placeholder:text-[#848078] min-h-[44px]"
                />
                {errors.fullName && (
                  <p
                    id="error-full-name"
                    role="alert"
                    className="mt-1.5 text-xs text-[#F4A28C]"
                  >
                    {errors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="booking-email"
                  className="block text-xs font-medium text-[#D4D0C7] mb-1.5"
                >
                  Email address <span aria-hidden="true">*</span>
                </label>
                <input
                  id="booking-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formValues.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? 'error-email' : undefined}
                  placeholder="aarav@domain.in"
                  className="glass-input w-full rounded-xl px-4 py-3 text-sm text-[#ECE8DF] placeholder:text-[#848078] min-h-[44px]"
                />
                {errors.email && (
                  <p
                    id="error-email"
                    role="alert"
                    className="mt-1.5 text-xs text-[#F4A28C]"
                  >
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="booking-phone"
                  className="block text-xs font-medium text-[#D4D0C7] mb-1.5"
                >
                  Phone number <span aria-hidden="true">*</span>
                </label>
                <input
                  id="booking-phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={formValues.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  aria-invalid={Boolean(errors.phone)}
                  aria-describedby={errors.phone ? 'error-phone' : undefined}
                  placeholder="081918 11100"
                  className="glass-input w-full rounded-xl px-4 py-3 text-sm text-[#ECE8DF] placeholder:text-[#848078] min-h-[44px]"
                />
                {errors.phone && (
                  <p
                    id="error-phone"
                    role="alert"
                    className="mt-1.5 text-xs text-[#F4A28C]"
                  >
                    {errors.phone}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="booking-vehicle"
                  className="block text-xs font-medium text-[#D4D0C7] mb-1.5"
                >
                  Vehicle (Make & Model) <span aria-hidden="true">*</span>
                </label>
                <input
                  id="booking-vehicle"
                  type="text"
                  required
                  value={formValues.vehicle}
                  onChange={(e) => updateField('vehicle', e.target.value)}
                  aria-invalid={Boolean(errors.vehicle)}
                  aria-describedby={errors.vehicle ? 'error-vehicle' : undefined}
                  placeholder="2025 BMW M340i"
                  className="glass-input w-full rounded-xl px-4 py-3 text-sm text-[#ECE8DF] placeholder:text-[#848078] min-h-[44px]"
                />
                {errors.vehicle && (
                  <p
                    id="error-vehicle"
                    role="alert"
                    className="mt-1.5 text-xs text-[#F4A28C]"
                  >
                    {errors.vehicle}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="booking-date"
                  className="block text-xs font-medium text-[#D4D0C7] mb-1.5"
                >
                  Preferred date <span aria-hidden="true">*</span>
                </label>
                <input
                  id="booking-date"
                  type="date"
                  min={getTodayIsoDate()}
                  required
                  value={formValues.preferredDate}
                  onChange={(e) => updateField('preferredDate', e.target.value)}
                  aria-invalid={Boolean(errors.preferredDate)}
                  aria-describedby={errors.preferredDate ? 'error-date' : undefined}
                  className="glass-input w-full rounded-xl px-4 py-3 text-sm text-[#ECE8DF] min-h-[44px]"
                />
                {errors.preferredDate && (
                  <p
                    id="error-date"
                    role="alert"
                    className="mt-1.5 text-xs text-[#F4A28C]"
                  >
                    {errors.preferredDate}
                  </p>
                )}
              </div>

              <div>
                <label
                  htmlFor="booking-slot"
                  className="block text-xs font-medium text-[#D4D0C7] mb-1.5"
                >
                  Inspection slot <span aria-hidden="true">*</span>
                </label>
                <select
                  id="booking-slot"
                  value={formValues.timeSlot}
                  onChange={(e) => updateField('timeSlot', e.target.value)}
                  aria-invalid={Boolean(errors.timeSlot)}
                  aria-describedby={errors.timeSlot ? 'error-slot' : undefined}
                  className="glass-input w-full rounded-xl px-4 py-3 text-sm text-[#ECE8DF] min-h-[44px]"
                >
                  {INSPECTION_SLOTS.map((slot) => (
                    <option key={slot} value={slot} className="bg-[#0C0C0F]">
                      {slot}
                    </option>
                  ))}
                </select>
                {errors.timeSlot && (
                  <p
                    id="error-slot"
                    role="alert"
                    className="mt-1.5 text-xs text-[#F4A28C]"
                  >
                    {errors.timeSlot}
                  </p>
                )}
              </div>
            </div>

            {/* Footer Note & Submit */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#ECE8DF]/14">
              <p className="font-mono-atelier text-[11px] tracking-[0.1em] text-[#A6A299]">
                30-minute paint depth audit · Confirmed upon studio inspection
              </p>

              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-full bg-[#ECE8DF] px-7 py-3.5 text-sm font-semibold text-[#060607] hover:bg-white transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98] min-h-[46px] whitespace-nowrap cursor-pointer"
              >
                Confirm inspection slot
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
