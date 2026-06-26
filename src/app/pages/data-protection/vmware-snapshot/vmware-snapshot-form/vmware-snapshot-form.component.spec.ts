import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetType } from 'app/enums/dataset.enum';
import { MatchDatastoresWithDatasets, VmwareSnapshot } from 'app/interfaces/vmware.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { VmwareSnapshotFormComponent } from './vmware-snapshot-form.component';

describe('VmwareSnapshotFormComponent', () => {
  const existingSnapshot = {
    id: 1,
    datastore: 'ds01',
    filesystem: 'fs01',
    hostname: '192.168.30.4',
    password: 'pleasechange',
    username: 'root',
  } as VmwareSnapshot;

  const slideInRef: SlideInRef<VmwareSnapshot | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  let spectator: Spectator<VmwareSnapshotFormComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: VmwareSnapshotFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('vmware.match_datastores_with_datasets', {
          filesystems: [
            {
              type: DatasetType.Filesystem,
              name: 'fs01',
              description: 'filesystem 01',
            },
            {
              type: DatasetType.Filesystem,
              name: 'fs02',
              description: 'filesystem 02',
            },
          ],
          datastores: [
            {
              name: 'ds01',
              description: 'datastore 01',
              filesystems: ['fs01', 'fs02'],
            },
            {
              name: 'ds02',
              description: 'datastore 02',
              filesystems: ['fs02', 'fs01'],
            },
          ],
        } as MatchDatastoresWithDatasets),
        mockCall('vmware.create'),
        mockCall('vmware.update'),
      ]),
      ...ixFormTestingProviders(),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInRef, slideInRef),
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  describe('creates a new vm snapshot', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('creates a new vm snapshot task when new form is saved', async () => {
      await (await getInput('hostname')).setValue('192.168.30.4');
      await (await getInput('username')).setValue('root');
      await (await getInput('password')).setValue('pleasechange');

      const fetchDatastoresButton = await loader.getHarness(TnButtonHarness.with({ label: 'Fetch DataStores' }));
      await fetchDatastoresButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vmware.match_datastores_with_datasets', [{
        hostname: '192.168.30.4',
        username: 'root',
        password: 'pleasechange',
      }]);

      await (await getSelect('datastore')).selectOption('ds01');
      expect(await (await getSelect('filesystem')).getDisplayText()).toBe('fs01');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vmware.create', [{
        hostname: '192.168.30.4',
        username: 'root',
        password: 'pleasechange',
        filesystem: 'fs01',
        datastore: 'ds01',
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('edits vm snapshot', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => ({ ...existingSnapshot }) }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for an existing vm snapshot task when it is open for edit', async () => {
      expect(await (await getInput('hostname')).getValue()).toBe('192.168.30.4');
      expect(await (await getInput('username')).getValue()).toBe('root');
      expect(await (await getInput('password')).getValue()).toBe('pleasechange');
      expect(await (await getSelect('filesystem')).getDisplayText()).toBe('fs01');
      expect(await (await getSelect('datastore')).getDisplayText()).toBe('ds01');
    });

    it('saves updated vm snapshot task when form opened for edit is saved', async () => {
      await (await getSelect('datastore')).selectOption('ds01');
      await (await getSelect('filesystem')).selectOption('fs02');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'The filesystem fs02 is filesystem 02, but datastore ds01 is datastore 01. Is this correct?',
        }),
      );

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('vmware.update', [
        1,
        {
          hostname: '192.168.30.4',
          username: 'root',
          password: 'pleasechange',
          filesystem: 'fs02',
          datastore: 'ds01',
        },
      ]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });
});
