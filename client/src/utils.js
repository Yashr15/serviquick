/**
 * Capitalizes the first letter of a string.
 * Returns an empty string for null/undefined/empty input.
 * @param {string} str
 * @returns {string}
 */
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
