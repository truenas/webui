export const hashMessage = (message: string): string => btoa(encodeURIComponent(message));
