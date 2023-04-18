import { KiB, MiB } from 'app/constants/bytes.constant';

export const specialSmallBlockSizeOptions = [
  { label: '0', value: 0 },
  { label: '512B', value: 512 },
  { label: '1K', value: KiB },
  { label: '2K', value: 2 * KiB },
  { label: '4K', value: 4 * KiB },
  { label: '8K', value: 8 * KiB },
  { label: '16K', value: 16 * KiB },
  { label: '32K', value: 32 * KiB },
  { label: '64K', value: 64 * KiB },
  { label: '128K', value: 128 * KiB },
  { label: '256K', value: 256 * KiB },
  { label: '512K', value: 512 * KiB },
  { label: '1M', value: MiB },
];
