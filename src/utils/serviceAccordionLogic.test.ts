import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_PRICE_PLACEHOLDER,
  SERVICES_MENU_CATEGORIES,
} from '../data/servicesMenuData';
import {
  createInitialServicesState,
  toggleServiceCategory,
  toggleServiceItem,
} from './serviceAccordionLogic';

test('initial services state starts with all categories collapsed and no service selected', () => {
  const initial = createInitialServicesState();
  assert.equal(initial.expandedCategoryId, null);
  assert.equal(initial.selectedServiceId, null);
});

test('toggleServiceCategory enforces single-open accordion and collapses on repeat click', () => {
  let state = createInitialServicesState();

  // Open Category 01
  state = toggleServiceCategory(state, 'wash-clean');
  assert.equal(state.expandedCategoryId, 'wash-clean');
  assert.equal(state.selectedServiceId, null);

  // Select a service inside Category 01
  state = toggleServiceItem(state, 'wash-foam-wash');
  assert.equal(state.selectedServiceId, 'wash-foam-wash');

  // Switch to Category 04 -> closes Category 01 and clears previous selected service
  state = toggleServiceCategory(state, 'polishing-paint-correction');
  assert.equal(state.expandedCategoryId, 'polishing-paint-correction');
  assert.equal(state.selectedServiceId, null);

  // Click Category 04 again -> collapses completely
  state = toggleServiceCategory(state, 'polishing-paint-correction');
  assert.equal(state.expandedCategoryId, null);
  assert.equal(state.selectedServiceId, null);
});

test('toggleServiceItem opens, switches, and collapses individual service details', () => {
  let state = toggleServiceCategory(
    createInitialServicesState(),
    'paint-protection',
  );

  state = toggleServiceItem(state, 'protection-graphene-coating');
  assert.equal(state.selectedServiceId, 'protection-graphene-coating');
  assert.equal(state.expandedCategoryId, 'paint-protection');

  // Switch to another service inside same category
  state = toggleServiceItem(state, 'protection-hydrophobic');
  assert.equal(state.selectedServiceId, 'protection-hydrophobic');

  // Click same service again -> collapses detail area
  state = toggleServiceItem(state, 'protection-hydrophobic');
  assert.equal(state.selectedServiceId, null);
  assert.equal(state.expandedCategoryId, 'paint-protection');
});

test('SERVICES_MENU_CATEGORIES contains the exact 5 categories, 24 services, and placeholder pricing', () => {
  assert.equal(SERVICES_MENU_CATEGORIES.length, 5);

  const expectedCounts = [5, 5, 5, 5, 4];
  const expectedIndices = ['01', '02', '03', '04', '05'];
  const expectedTitles = [
    'Wash & Clean',
    'Exterior Detailing',
    'Interior Detailing',
    'Polishing & Paint Correction',
    'Paint Protection',
  ];

  SERVICES_MENU_CATEGORIES.forEach((cat, idx) => {
    assert.equal(cat.index, expectedIndices[idx]);
    assert.equal(cat.title, expectedTitles[idx]);
    assert.equal(cat.services.length, expectedCounts[idx]);
    for (const service of cat.services) {
      assert.equal(service.pricePlaceholder, DEFAULT_PRICE_PLACEHOLDER);
      assert.ok(service.description.length > 20);
    }
  });
});
