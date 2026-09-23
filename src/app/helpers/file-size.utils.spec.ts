import { GiB } from 'app/constants/bytes.constant';
import { buildNormalizedFileSize, buildRoundedUpFileSize, convertStringDiskSizeToBytes } from 'app/helpers/file-size.utils';

describe('buildNormalizedFileSize with base 2', () => {
  it('converts 1000 bytes to 1000 B with base 2', () => {
    expect(buildNormalizedFileSize(1000)).toBe('1000 B');
  });

  it('converts 1024 bytes to 1 KiB with base 2', () => {
    expect(buildNormalizedFileSize(1024)).toBe('1 KiB');
  });

  it('converts 1024^2 bytes to 1 MiB with base 2', () => {
    expect(buildNormalizedFileSize(1024 ** 2)).toBe('1 MiB');
  });

  it('converts 1024^3 bytes to 1 GiB with base 2', () => {
    expect(buildNormalizedFileSize(1024 ** 3)).toBe('1 GiB');
  });

  it('converts 1024^4 bytes to 1 TiB with base 2', () => {
    expect(buildNormalizedFileSize(1024 ** 4)).toBe('1 TiB');
  });

  it('converts 1024^5 bytes to 1 PiB with base 2', () => {
    expect(buildNormalizedFileSize(1024 ** 5)).toBe('1 PiB');
  });

  it('converts 1024^6 bytes to 1 EiB with base 2', () => {
    expect(buildNormalizedFileSize(1024 ** 6)).toBe('1 EiB');
  });

  it('converts 1024^7 bytes to 1 ZiB with base 2', () => {
    expect(buildNormalizedFileSize(1024 ** 7)).toBe('1 ZiB');
  });

  it('converts 1024^8 bytes to 1 YiB with base 2', () => {
    expect(buildNormalizedFileSize(1024 ** 8)).toBe('1 YiB');
  });

  it('converts 1024^9 bytes to 1024 YiB with base 2', () => {
    expect(buildNormalizedFileSize(1024 ** 9)).toBe('1024 YiB');
  });
});

describe('buildNormalizedFileSize with base 10', () => {
  it('converts 500 bits to 500 b with base 10', () => {
    expect(buildNormalizedFileSize(500, 'b', 10)).toBe('500 b');
  });

  it('converts 1000 bits to 1 kb with base 10', () => {
    expect(buildNormalizedFileSize(1000, 'b', 10)).toBe('1 kb');
  });

  it('converts 1000^2 bits to 1 Mb with base 10', () => {
    expect(buildNormalizedFileSize(1000 ** 2, 'b', 10)).toBe('1 Mb');
  });

  it('converts 1000^3 bits to 1 Gb with base 10', () => {
    expect(buildNormalizedFileSize(1000 ** 3, 'b', 10)).toBe('1 Gb');
  });

  it('converts 1000^4 bits to 1 Tb with base 10', () => {
    expect(buildNormalizedFileSize(1000 ** 4, 'b', 10)).toBe('1 Tb');
  });

  it('converts 1000^5 bits to 1 Pb with base 10', () => {
    expect(buildNormalizedFileSize(1000 ** 5, 'b', 10)).toBe('1 Pb');
  });

  it('converts 1000^6 bits to 1 Eb with base 10', () => {
    expect(buildNormalizedFileSize(1000 ** 6, 'b', 10)).toBe('1 Eb');
  });

  it('converts 1000^7 bits to 1 Zb with base 10', () => {
    expect(buildNormalizedFileSize(1000 ** 7, 'b', 10)).toBe('1 Zb');
  });

  it('converts 1000^8 bits to 1 Yb with base 10', () => {
    expect(buildNormalizedFileSize(1000 ** 8, 'b', 10)).toBe('1 Yb');
  });

  it('converts 1000^9 bits to 1000 Yb with base 10', () => {
    expect(buildNormalizedFileSize(1000 ** 9, 'b', 10)).toBe('1000 Yb');
  });
});

describe('buildRoundedUpFileSize', () => {
  it('leaves a size that a unit states exactly alone', () => {
    expect(buildRoundedUpFileSize(50 * GiB)).toBe('50 GiB');
    expect(buildRoundedUpFileSize(1024)).toBe('1 KiB');
    expect(buildRoundedUpFileSize(0)).toBe('0 B');
  });

  it('rounds up rather than to the nearest hundredth of a unit', () => {
    expect(buildRoundedUpFileSize(50 * GiB + 4096)).toBe('50.01 GiB');
    expect(buildRoundedUpFileSize(50 * GiB + 1)).toBe('50.01 GiB');
    expect(buildNormalizedFileSize(50 * GiB + 4096)).toBe('50 GiB');
  });

  it('never renders a size smaller than the one given', () => {
    // What a size field makes of the rendering: the number times its unit, to whole bytes.
    const units: Record<string, number> = {
      B: 1, KiB: 1024, MiB: 1024 ** 2, GiB: 1024 ** 3, TiB: 1024 ** 4,
    };
    const sizes = [0, 1, 1023, 1025, 12345678, 50 * GiB - 1, 50 * GiB, 50 * GiB + 4096, 1024 ** 4 + 7];

    sizes.forEach((size) => {
      const [amount, unit] = buildRoundedUpFileSize(size).split(' ');
      expect(Math.round(Number(amount) * units[unit])).toBeGreaterThanOrEqual(size);
    });
  });

  it('rounds up in base 10 as well', () => {
    expect(buildRoundedUpFileSize(1000 ** 3 + 1, 'b', 10)).toBe('1.01 Gb');
  });
});

describe('convertStringDiskSizeToBytes', () => {
  it('converts 16 gib of disk size to bytes', () => {
    expect(convertStringDiskSizeToBytes('16 gib')).toBe(17179869184);
  });

  it('converts 16 g of disk size to bytes', () => {
    expect(convertStringDiskSizeToBytes('16 g')).toBe(17179869184);
  });

  it('converts 16 gb of disk size to bytes', () => {
    expect(convertStringDiskSizeToBytes('16 gb')).toBe(17179869184);
  });

  it('handles invalid value', () => {
    expect(convertStringDiskSizeToBytes('1 dummy')).toBeNull();
  });
});
