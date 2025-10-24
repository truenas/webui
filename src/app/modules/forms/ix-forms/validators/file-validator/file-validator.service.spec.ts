import { signal } from '@angular/core';
import { FormControl, ValidatorFn } from '@angular/forms';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { MiB } from 'app/constants/bytes.constant';
import { fakeFile } from 'app/core/testing/utils/fake-file.uitls';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { ExplorerNodeData, TreeNode } from 'app/interfaces/tree-node.interface';
import { ixManualValidateError } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { FileValidatorService } from 'app/modules/forms/ix-forms/validators/file-validator/file-validator.service';

describe('FileValidatorService', () => {
  const maxSizeInBytes = 10 * MiB;
  const fileIsSelectedErr = { selectionMustBeFile: true };
  let spectator: SpectatorService<FileValidatorService>;
  let maxSizeValidatorFn: ValidatorFn;
  let fileIsSelectedValidatorFn: ValidatorFn;
  let mockExplorer: Partial<IxExplorerComponent>;

  const createService = createServiceFactory({
    service: FileValidatorService,
  });

  beforeEach(() => {
    spectator = createService();

    mockExplorer = {
      lastSelectedNode: signal<TreeNode<ExplorerNodeData> | null>(null),
    };

    maxSizeValidatorFn = spectator.service.maxSize(maxSizeInBytes);
    fileIsSelectedValidatorFn = spectator.service.fileIsSelectedInExplorer(
      () => mockExplorer as IxExplorerComponent,
    );
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
      [ixManualValidateError]: {
        message: 'Maximum file size is limited to 10 MiB.',
      },
    });
  });

  describe('fileIsSelectedInExplorer', () => {
    it('should return null when the form is empty', () => {
      const control = new FormControl('');
      expect(fileIsSelectedValidatorFn(control)).toBeNull();
    });

    it('should return null when no node is selected but the form contains a value', () => {
      const control = new FormControl('/mnt/dozer/dataset');
      expect(fileIsSelectedValidatorFn(control)).toBeNull();
    });

    it('should return null when control value does not match last selected path', () => {
      mockExplorer.lastSelectedNode.set({
        data: {
          path: '/mnt/dozer/dataset',
          name: 'dataset',
          type: ExplorerNodeType.Directory,
        } as ExplorerNodeData,
      } as TreeNode<ExplorerNodeData>);

      const control = new FormControl('/mnt/pool/other');
      expect(fileIsSelectedValidatorFn(control)).toBeNull();
    });

    it('should return null when selected node is a file', () => {
      mockExplorer.lastSelectedNode.set({
        data: {
          path: '/mnt/dozer/myfile.dat',
          name: 'myfile.dat',
          type: ExplorerNodeType.File,
        } as ExplorerNodeData,
      } as TreeNode<ExplorerNodeData>);

      const control = new FormControl('/mnt/dozer/myfile.dat');
      expect(fileIsSelectedValidatorFn(control)).toBeNull();
    });

    it('should return an error when selected node is a directory', () => {
      mockExplorer.lastSelectedNode?.set({
        data: {
          path: '/mnt/dozer/dataset',
          name: 'dataset',
          type: ExplorerNodeType.Directory,
        } as ExplorerNodeData,
      } as TreeNode<ExplorerNodeData>);

      const control = new FormControl('/mnt/dozer/dataset');
      expect(fileIsSelectedValidatorFn(control)).toEqual(fileIsSelectedErr);
    });

    it('should return an error when selected node is a symlink', () => {
      mockExplorer.lastSelectedNode?.set({
        data: {
          path: '/mnt/dozer/link',
          name: 'link',
          type: ExplorerNodeType.Symlink,
        } as ExplorerNodeData,
      } as TreeNode<ExplorerNodeData>);

      const control = new FormControl('/mnt/dozer/link');
      expect(fileIsSelectedValidatorFn(control)).toEqual(fileIsSelectedErr);
    });
  });
});
