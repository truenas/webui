import { HttpClient } from '@angular/common/http';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';

describe('StorageService', () => {
  const storageService = new StorageService(
    {} as WebSocketService,
    {} as HttpClient,
  );

  describe('convertBytesToHumanReadable', () => {
    it('format bytes to human readable string with 2 decimal points by default', () => {
      const transformed = storageService.convertBytesToHumanReadable(1474828);

      expect(transformed).toBe('1.41 MiB');
    });

    it('returns 0 when bytes is 0', () => {
      const transformed = storageService.convertBytesToHumanReadable(0);

      expect(transformed).toBe('0.00 bytes');
    });

    it('accepts string as number of bytes', () => {
      const transformed = storageService.convertBytesToHumanReadable('44722');

      expect(transformed).toBe('43.67 KiB');
    });
  });
});
