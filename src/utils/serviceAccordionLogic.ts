import type { ServiceMenuCategoryId } from '../data/servicesMenuData';

export interface ServicesAccordionState {
  expandedCategoryId: ServiceMenuCategoryId | null;
  selectedServiceId: string | null;
}

export function createInitialServicesState(): ServicesAccordionState {
  return {
    expandedCategoryId: null,
    selectedServiceId: null,
  };
}

/**
 * Single-open accordion toggle:
 * - Clicking a closed category opens it and closes any previously open category.
 * - Clicking the currently open category collapses it.
 * - Switching or closing a category resets any expanded sub-service detail panel.
 */
export function toggleServiceCategory(
  state: ServicesAccordionState,
  categoryId: ServiceMenuCategoryId,
): ServicesAccordionState {
  if (state.expandedCategoryId === categoryId) {
    return {
      expandedCategoryId: null,
      selectedServiceId: null,
    };
  }

  return {
    expandedCategoryId: categoryId,
    selectedServiceId: null,
  };
}

/**
 * Individual service detail toggle:
 * - Clicking an unselected service highlights it and expands its detail area.
 * - Clicking the already selected service collapses its detail area.
 */
export function toggleServiceItem(
  state: ServicesAccordionState,
  serviceId: string,
): ServicesAccordionState {
  if (state.selectedServiceId === serviceId) {
    return {
      ...state,
      selectedServiceId: null,
    };
  }

  return {
    ...state,
    selectedServiceId: serviceId,
  };
}
