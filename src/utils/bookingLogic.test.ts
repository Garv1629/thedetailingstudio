import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEstimate,
  clampPercent,
  computeActiveSection,
  formatBookingReference,
  formatCurrency,
  getCategoryTitle,
  getSubServicesForCategory,
  validateBookingForm,
} from './bookingLogic';

test('getSubServicesForCategory returns exact sub-services for main categories', () => {
  const washSubs = getSubServicesForCategory('wash-clean');
  assert.equal(washSubs.length, 7);
  assert.ok(washSubs.includes('Premium Hand Wash'));

  const ppfSubs = getSubServicesForCategory('ppf-protection');
  assert.equal(ppfSubs.length, 9);
  assert.ok(ppfSubs.includes('Full Body PPF'));
  assert.ok(ppfSubs.includes('Coloured PPF'));

  const restorationSubs = getSubServicesForCategory('restoration-specialty');
  assert.equal(restorationSubs.length, 15);
  assert.ok(restorationSubs.includes('Pickup & Drop'));
  assert.equal(getCategoryTitle('ceramic-graphene'), 'Ceramic & Graphene Coating');
});

test('calculateEstimate computes INR package totals and studio durations accurately', () => {
  const gloss = calculateEstimate('gloss', false, false);
  assert.equal(gloss.totalPrice, 6500);
  assert.equal(gloss.estimatedDaysLabel, '1–2 days');

  const shieldWithAddons = calculateEstimate('shield', true, true);
  assert.equal(shieldWithAddons.basePrice, 18500);
  assert.equal(shieldWithAddons.wrapAddon, 42000);
  assert.equal(shieldWithAddons.interiorAddon, 3500);
  assert.equal(shieldWithAddons.totalPrice, 64000);
  assert.equal(shieldWithAddons.estimatedDaysLabel, '4–5 days');

  // Signature package includes deep interior detailing at no extra charge
  const signatureWithInterior = calculateEstimate('signature', false, true);
  assert.equal(signatureWithInterior.interiorAddon, 0);
  assert.equal(signatureWithInterior.totalPrice, 65000);
});

test('validateBookingForm rejects missing or malformed inputs', () => {
  const emptyErrors = validateBookingForm({
    fullName: '',
    email: 'invalid-email',
    phone: '12345',
    vehicle: 'A',
    subService: '',
    preferredDate: '',
    timeSlot: '',
  });

  assert.ok(emptyErrors.fullName);
  assert.ok(emptyErrors.email);
  assert.ok(emptyErrors.phone);
  assert.ok(emptyErrors.vehicle);
  assert.ok(emptyErrors.subService);
  assert.ok(emptyErrors.preferredDate);
  assert.ok(emptyErrors.timeSlot);
});

test('validateBookingForm passes complete valid Greater Noida booking payloads', () => {
  const validErrors = validateBookingForm({
    fullName: 'Aarav Sharma',
    email: 'aarav@noida.in',
    phone: '081918 11100',
    vehicle: '2025 BMW M340i',
    subService: 'Full Body PPF',
    preferredDate: '2026-12-04',
    timeSlot: '11:00 AM',
  });

  assert.deepEqual(validErrors, {});
});

test('formatCurrency and formatBookingReference return deterministic INR strings', () => {
  assert.equal(formatCurrency(65000), '₹65,000');
  assert.equal(formatCurrency(18500), '₹18,500');
  assert.equal(formatBookingReference('2026-12-04', 42), 'TDS-1204-1042');
});

test('computeActiveSection resolves the active chapter including scroll waypoints', () => {
  const sections = [
    { id: 'top' as const, top: 0, height: 900 },
    { id: 'wash-clean' as const, top: 900, height: 850 },
    { id: 'correction' as const, top: 1750, height: 1200 },
    { id: 'book' as const, top: 2950, height: 1000 },
  ];

  assert.equal(computeActiveSection(0, sections, 900), 'top');
  assert.equal(computeActiveSection(700, sections, 900), 'wash-clean');
  assert.equal(computeActiveSection(1600, sections, 900), 'correction');
  assert.equal(computeActiveSection(2800, sections, 900), 'book');
});

test('clampPercent bounds slider input safely between 0 and 100', () => {
  assert.equal(clampPercent(-12), 0);
  assert.equal(clampPercent(140), 100);
  assert.equal(clampPercent(64.4), 64);
  assert.equal(clampPercent(Number.NaN), 50);
});
