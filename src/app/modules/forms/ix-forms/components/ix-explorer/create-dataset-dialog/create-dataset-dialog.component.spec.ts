import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetAclType, DatasetCaseSensitivity } from 'app/enums/dataset.enum';
import { Dataset, DatasetCreate } from 'app/interfaces/dataset.interface';
import { CreateDatasetDialogComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/create-dataset-dialog/create-dataset-dialog.component';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { WebSocketService } from 'app/services/ws.service';

describe('CreateDatasetDialogComponent', () => {
  let spectator: Spectator<CreateDatasetDialogComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: CreateDatasetDialogComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('pool.dataset.query', [{
          name: 'parent_name',
          casesensitivity: { value: DatasetCaseSensitivity.Sensitive },
          children: [
            { name: 'some_dataset' },
          ],
        }] as Dataset[]),
        mockCall('pool.dataset.create', { name: 'created_dataset' } as Dataset),
      ]),
      mockProvider(MatDialogRef),
    ],
  });

  function setupTest(parentId = 'pool/parent-dataset'): void {
    spectator = createComponent({
      providers: [
        {
          provide: MAT_DIALOG_DATA,
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
      const datasetName = await loader.getHarness(IxInputHarness.with({ label: 'Name' }));
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'SoMe_DaTaSeT',
      });

      expect(await datasetName.getErrorText()).toBe('The name "some_dataset" is already in use.');

      await form.fillForm({
        Name: 'new_some_dataset',
      });
      expect(await datasetName.getErrorText()).toBe('');
    });

    it('creates new dataset when Create button is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Name: 'new_dataset',
      });

      const createButton = await loader.getHarness(MatButtonHarness.with({ text: 'Create' }));
      await createButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('pool.dataset.create', [{
        name: 'parent_name/new_dataset',
        acltype: DatasetAclType.Nfsv4,
      }]);

      expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith({
        name: 'created_dataset',
      });
    });
  });

  describe('special cases', () => {
    it('loads correct parent dataset even if parent id was passed in with leading slash', () => {
      setupTest('/pool/parent-dataset-with-slash/');

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
        'pool.dataset.query',
        [[['id', '=', '/pool/parent-dataset-with-slash']]],
      );
    });
  });
});
