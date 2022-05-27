import * as mimeTypes from 'mime-types';

export function fakeFile(name = 'test.txt', size = 1024): File {
  const bits = [new Array(size).fill(0).join('')];
  const mimeType = mimeTypes.lookup(name) || 'text/plain';
  return new File(bits, name, { type: mimeType });
}
