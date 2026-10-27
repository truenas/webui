import { signal } from '@angular/core';
import { FormControl, ValidatorFn } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { FileSystemItem } from '@truenas/ui-components';
import { MiB } from 'app/constants/bytes.constant';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { ixManualValidateErrorKey } from 'app/modules/forms/ix-forms/manual-validate-error.constants';
import { FileValidatorService } from 'app/modules/forms/ix-forms/validators/file-validator/file-validator.service';

describe('FileValidatorService', () => {
  const maxSizeInBytes = 10 * MiB;
  const fileIsSelectedErr = { selectionMustBeFile: true };
  let spectator: SpectatorService<FileValidatorService>;
  let maxSizeValidatorFn: ValidatorFn;
  let fileIsSelectedValidatorFn: ValidatorFn;
  const selectedItem = signal<FileSystemItem | null>(null);

  const createService = createServiceFactory({
    service: FileValidatorService,
  });

  beforeEach(() => {
    spectator = createService();

    selectedItem.set(null);

    maxSizeValidatorFn = spectator.service.maxSize(maxSizeInBytes);
    fileIsSelectedValidatorFn = spectator.service.fileIsSelected(selectedItem);
  });

  it('should return null if value is null', () => {
    const control = new FormControl(null as File[] | null);
    expect(maxSizeValidatorFn(control)).toBeNull();
  });

  it('should return null if there are no files in the array', () => {
    const control = new FormControl([] as File[]);
    expect(maxSizeValidatorFn(control)).toBeNull();
  });

  it('should return null if all files are within size limit', () => {
    const file1 = fakeFile('file1.txt', 2 * MiB);

    const control = new FormControl([file1]);
    expect(maxSizeValidatorFn(control)).toBeNull();
  });

  it('should return an error object if any file exceeds the size limit', () => {
    const file1 = fakeFile('file1.txt', 11 * MiB);

    const control = new FormControl([file1]);
    expect(maxSizeValidatorFn(control)).toEqual({
      [ixManualValidateErrorKey]: {
        message: 'Maximum file size is limited to 10 MiB.',
      },
    });
  });

  describe('fileIsSelected', () => {
    it('should return null when the form is empty', () => {
      const control = new FormControl('');
      expect(fileIsSelectedValidatorFn(control)).toBeNull();
    });

    it('should return null when no node is selected but the form contains a value', () => {
      const control = new FormControl('/mnt/dozer/dataset');
      expect(fileIsSelectedValidatorFn(control)).toBeNull();
    });

    it('should return null when control value does not match last selected path', () => {
      selectedItem.set({
        path: '/mnt/dozer/dataset',
        name: 'dataset',
        type: 'folder',
      } as FileSystemItem);

      const control = new FormControl('/mnt/pool/other');
      expect(fileIsSelectedValidatorFn(control)).toBeNull();
    });

    it('should return null when selected node is a file', () => {
      selectedItem.set({
        path: '/mnt/dozer/myfile.dat',
        name: 'myfile.dat',
        type: 'file',
      } as FileSystemItem);

      const control = new FormControl('/mnt/dozer/myfile.dat');
      expect(fileIsSelectedValidatorFn(control)).toBeNull();
    });

    it('should return an error when selected node is a directory', () => {
      selectedItem.set({
        path: '/mnt/dozer/dataset',
        name: 'dataset',
        type: 'folder',
      } as FileSystemItem);

      const control = new FormControl('/mnt/dozer/dataset');
      expect(fileIsSelectedValidatorFn(control)).toEqual(fileIsSelectedErr);
    });

    it('should return an error when selected node is a dataset', () => {
      selectedItem.set({
        path: '/mnt/dozer',
        name: 'dozer',
        type: 'dataset',
      } as FileSystemItem);

      const control = new FormControl('/mnt/dozer');
      expect(fileIsSelectedValidatorFn(control)).toEqual(fileIsSelectedErr);
    });
  });
});
