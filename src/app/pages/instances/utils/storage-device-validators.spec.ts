import { FormControl } from '@angular/forms';
import {
  blockDeviceNameValidator,
  containerPathValidator,
  diskPathValidator,
  poolPathValidator,
  rawFilePathValidator,
} from './storage-device-validators';

describe('Storage Device Validators', () => {
  describe('blockDeviceNameValidator', () => {
    it('should accept valid SATA/SCSI device names', () => {
      const validator = blockDeviceNameValidator();
      expect(validator(new FormControl('sda'))).toBeNull();
      expect(validator(new FormControl('sdb'))).toBeNull();
      expect(validator(new FormControl('sdz'))).toBeNull();
    });

    it('should accept valid VirtIO device names', () => {
      const validator = blockDeviceNameValidator();
      expect(validator(new FormControl('vda'))).toBeNull();
      expect(validator(new FormControl('vdb'))).toBeNull();
    });

    it('should accept valid NVMe device names', () => {
      const validator = blockDeviceNameValidator();
      expect(validator(new FormControl('nvme0n1'))).toBeNull();
      expect(validator(new FormControl('nvme1n2'))).toBeNull();
    });

    it('should reject invalid device names', () => {
      const validator = blockDeviceNameValidator();
      expect(validator(new FormControl('invalid'))).toEqual({
        blockDeviceName: { message: expect.any(String) },
      });
      expect(validator(new FormControl('sd1'))).toEqual({
        blockDeviceName: { message: expect.any(String) },
      });
      expect(validator(new FormControl('/dev/sda'))).toEqual({
        blockDeviceName: { message: expect.any(String) },
      });
    });

    it('should allow empty values', () => {
      const validator = blockDeviceNameValidator();
      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
    });
  });

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

  describe('diskPathValidator', () => {
    it('should accept valid /dev/zvol/ paths', () => {
      const validator = diskPathValidator();
      expect(validator(new FormControl('/dev/zvol/tank/my-zvol'))).toBeNull();
      expect(validator(new FormControl('/dev/zvol/pool/dataset/zvol'))).toBeNull();
    });

    it('should reject paths not starting with /dev/zvol/', () => {
      const validator = diskPathValidator();
      expect(validator(new FormControl('/mnt/tank/disk'))).toEqual({
        diskPath: { message: expect.any(String) },
      });
      expect(validator(new FormControl('/dev/sda'))).toEqual({
        diskPath: { message: expect.any(String) },
      });
      expect(validator(new FormControl('tank/my-zvol'))).toEqual({
        diskPath: { message: expect.any(String) },
      });
    });

    it('should allow empty values', () => {
      const validator = diskPathValidator();
      expect(validator(new FormControl(''))).toBeNull();
      expect(validator(new FormControl(null))).toBeNull();
    });
  });

  describe('rawFilePathValidator', () => {
    it('should accept valid /mnt/ paths', () => {
      const validator = rawFilePathValidator();
      expect(validator(new FormControl('/mnt/tank/disk.img'))).toBeNull();
      expect(validator(new FormControl('/mnt/pool/data/file.raw'))).toBeNull();
    });

    it('should reject paths not starting with /mnt/', () => {
      const validator = rawFilePathValidator();
      expect(validator(new FormControl('/dev/zvol/tank/disk'))).toEqual({
        rawFilePath: { message: expect.any(String) },
      });
      expect(validator(new FormControl('/var/lib/disk.img'))).toEqual({
        rawFilePath: { message: expect.any(String) },
      });
      expect(validator(new FormControl('tank/disk.img'))).toEqual({
        rawFilePath: { message: expect.any(String) },
      });
    });

    it('should allow empty values', () => {
      const validator = rawFilePathValidator();
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
