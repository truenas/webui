/**
 * Added because JSDOM didn't have support for some CSS features like @layer.
 * TODO: Review at some point if this is still needed.
 */
export function suppressJsDomCssErrors(): void {
  jest.spyOn(console, 'error').mockImplementation((error: Error) => {
    if (error.message === 'Could not parse CSS stylesheet') {
      return;
    }

    throw error;
  });
}
