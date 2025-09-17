// Polyfill ReadableStream for Node.js environment
if (typeof globalThis.ReadableStream === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).ReadableStream = class ReadableStream {};
}

export {};