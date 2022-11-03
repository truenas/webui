import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';

export enum CompressionType {
  Disabled = 'DISABLED',
  Lz4 = 'LZ4',
  Pigz = 'PIGZ',
  PlZip = 'PLZIP',
}

export const compressionTypeNames = new Map<CompressionType, string>([
  [CompressionType.Disabled, T('Disabled')],
  [CompressionType.Lz4, T('lz4 (fastest)')],
  [CompressionType.Pigz, T('pigz (all rounder)')],
  [CompressionType.PlZip, T('plzip (best compression)')],
]);
