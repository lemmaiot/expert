
declare global {
  interface Window {
    FingerprintJS: {
      load: () => Promise<{ get: (options: { debug: boolean }) => Promise<{ visitorId: string }> }>;
    };
  }
}

/**
 * Waits for the FingerprintJS library to be available on the window object.
 * This is designed to be robust against race conditions where this code
 * runs before the FingerprintJS script has finished loading from the CDN.
 *
 * @param timeout The maximum time to wait in milliseconds.
 * @returns A promise that resolves to true if the library loads, false otherwise.
 */
const waitForFingerprintJS = (timeout = 5000): Promise<boolean> => {
  return new Promise((resolve) => {
    // Check if it's already available
    if (window.FingerprintJS) {
      return resolve(true);
    }

    const startTime = Date.now();

    const check = () => {
      if (window.FingerprintJS) {
        resolve(true);
      } else if (Date.now() - startTime > timeout) {
        resolve(false);
      } else {
        // Use requestAnimationFrame for efficient polling
        window.requestAnimationFrame(check);
      }
    };

    check();
  });
};

/**
 * Gets a unique visitor identifier using FingerprintJS.
 * It waits for the library to load and returns a unique ID.
 * If it fails, it provides a fallback ID and logs a detailed error.
 *
 * @returns The visitor's unique ID or a fallback ID.
 */
export const getVisitorId = async (): Promise<string> => {
  const loaded = await waitForFingerprintJS();

  if (!loaded || !window.FingerprintJS) {
    console.error(
      "FingerprintJS failed to load within the timeout period. This could be due to a network issue or an ad-blocker."
    );
    return `fallback-${Date.now()}`;
  }
  
  try {
    const fp = await window.FingerprintJS.load();
    const result = await fp.get({ debug: false });
    return result.visitorId;
  } catch (error) {
    console.error('Error getting visitorId from FingerprintJS:', error);
    return `fallback-error-${Date.now()}`;
  }
};
