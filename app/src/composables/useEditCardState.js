import { ref, readonly } from 'vue';

// This composable provides a simple, global state to track if any EditCard
// component is currently in an active editing state. This prevents multiple
// inline editors from being open simultaneously.

// A private, reactive variable to hold the state.
const isAnyCardActive = ref(false);

/**
 * A composable function to manage the global state of edit cards.
 * @returns {object} An object with methods to get and set the active state.
 */
export function useEditCardState() {

  /**
   * Sets the global state for whether any edit card is active.
   * @param {boolean} isActive - The new state.
   */
  const setAnyCardIsActive = (isActive) => {
    isAnyCardActive.value = isActive;
  };

  return {
    // We return a readonly version of the state to prevent direct mutation from components.
    isAnyCardActive: readonly(isAnyCardActive),
    setAnyCardIsActive,
  };
}
