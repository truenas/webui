import { FormControl } from '@angular/forms';
import {
  containerPathValidator,
  poolPathValidator,
} from './storage-device-validators';

describe('Storage Device Validators', () => {
  describe('containerPathValidator', () => {
    it('should accept valid absolute paths', () => {
      const validator = containerPathValidator();
      expect(validator(new FormControl('/'))).toBeNull();
      expect(validator(new FormControl('/data'))).toBeNull();
      expect(validator(new FormControl('/var/lib/data'))).toBeNull();
      expect(validator(new FormControl('/opt/my-app'))).toBeNull();
    });

    it('should reject paths not starting with /', () => {
      const validator = containerPathValidator();
      expect(validator(new FormControl('data'))).toEqual({
        containerPath: { message: expect.any(String) },
      });
      expect(validator(new FormControl('var/lib'))).toEqual({
        containerPath: { message: expect.any(String) },
      });
    });

    it('should reject paths ending with / (except root)', () => {
      const validator = containerPathValidator();
      expect(validator(new FormControl('/data/'))).toEqual({
        containerPath: { message: expect.any(String) },
      });
    });

    it('should reject paths with double slashes', () => {
      const validator = containerPathValidator();
      expect(validator(new FormControl('/data//files'))).toEqual({
        containerPath: { message: expect.any(String) },
      });
    });

    it('should allow empty values', () => {
      const validator = containerPathValidator();
      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
    });
  });

  describe('poolPathValidator', () => {
    it('should accept valid /mnt/ paths', () => {
      const validator = poolPathValidator();
      expect(validator(new FormControl('/mnt/tank/dataset'))).toBeNull();
      expect(validator(new FormControl('/mnt/pool/data'))).toBeNull();
    });

    it('should reject paths not starting with /mnt/', () => {
      const validator = poolPathValidator();
      expect(validator(new FormControl('/dev/zvol/tank/disk'))).toEqual({
        poolPath: { message: expect.any(String) },
      });
      expect(validator(new FormControl('/var/lib/data'))).toEqual({
        poolPath: { message: expect.any(String) },
      });
      expect(validator(new FormControl('tank/dataset'))).toEqual({
        poolPath: { message: expect.any(String) },
      });
    });

    it('should allow empty values', () => {
      const validator = poolPathValidator();
      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
    });
  });
});
