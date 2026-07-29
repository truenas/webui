import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnFormFieldHarness, TnInputHarness } from '@truenas/ui-components';
import { provideTnFormFieldErrors } from 'app/core/providers/tn-form-field-errors.provider';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetAclType, DatasetCaseSensitivity } from 'app/enums/dataset.enum';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import { CreateDatasetDialog } from 'app/modules/forms/ix-forms/components/ix-explorer/create-dataset-dialog/create-dataset-dialog.component';
import { ApiService } from 'app/modules/websocket/api.service';

describe('CreateDatasetDialogComponent', () => {
  let spectator: Spectator<CreateDatasetDialog>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CreateDatasetDialog,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      provideTnFormFieldErrors(),
      mockApi([
        mockCall('pool.dataset.query', [{
          name: 'parent_name',
          casesensitivity: { value: DatasetCaseSensitivity.Insensitive },
          children: [
            { name: 'some_dataset' },
          ],
        }] as Dataset[]),
        mockCall('pool.dataset.create', { name: 'created_dataset' } as Dataset),
      ]),
      mockProvider(DialogRef),
    ],
  });

  function setupTest(parentId = 'pool/parent-dataset'): void {
    spectator = createComponent({
      providers: [
        {
          provide: DIALOG_DATA,
          useValue: {
            parentId,
            dataset: { acltype: DatasetAclType.Nfsv4 } as DatasetCreate,
          },
        },
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  describe('normal operation', () => {
    beforeEach(() => setupTest());

    it('checks validation error when dataset name already in use', async () => {
      const nameField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Name' }));
      const nameInput = await loader.getHarness(TnInputHarness);
      await nameInput.setValue('SoMe_DaTaSeT');

      expect(await nameField.getErrorMessage()).toBe('The name "some_dataset" is already in use.');

      await nameInput.setValue('new_some_dataset');
      expect(await nameField.getErrorMessage()).toBeNull();
    });

    it('creates new dataset when Create button is pressed', async () => {
      const nameInput = await loader.getHarness(TnInputHarness);
      await nameInput.setValue('new_dataset');

      const createButton = await loader.getHarness(TnButtonHarness.with({ label: 'Create' }));
      await createButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.dataset.create', [{
        name: 'parent_name/new_dataset',
        acltype: DatasetAclType.Nfsv4,
      }]);

      expect(spectator.inject(DialogRef).close).toHaveBeenCalledWith({
        name: 'created_dataset',
      });
    });
  });

  describe('special cases', () => {
    it('loads correct parent dataset even if parent id was passed in with leading slash', () => {
      setupTest('/pool/parent-dataset-with-slash/');

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith(
        'pool.dataset.query',
        [[['id', '=', '/pool/parent-dataset-with-slash']]],
      );
    });
  });
});
