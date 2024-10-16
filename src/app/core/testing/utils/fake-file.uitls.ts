import * as mimeTypes from 'mime-types';

export function fakeFile(name = 'test.txt', size = 1024): File {
  const bits = [new Array(size).fill(0).join('')];
  const mimeType = mimeTypes.lookup(name) || 'text/plain';
  const file = new File(bits, name, { type: mimeType });
  file.text = () => Promise.resolve('test_text');
  return file;
}
