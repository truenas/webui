import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { PoolFindResult } from 'app/interfaces/pool-import.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { WebSocketService } from 'app/services/ws.service';
import { ImportPoolComponent } from './import-pool.component';

describe('ImportPoolComponent', () => {
  let spectator: Spectator<ImportPoolComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: ImportPoolComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockJob('pool.import_pool', fakeSuccessfulJob()),
        mockJob(
          'pool.import_find',
          fakeSuccessfulJob([{
            name: 'pool_name_1',
            guid: 'pool_guid_1',
            hostname: 'pool_hostname_1',
            status: PoolStatus.Online,
          }, {
            name: 'pool_name_2',
            guid: 'pool_guid_2',
            hostname: 'pool_hostname_2',
            status: PoolStatus.Online,
          }, {
            name: 'pool_name_3',
            guid: 'pool_guid_3',
            hostname: 'pool_hostname_3',
            status: PoolStatus.Online,
          }] as PoolFindResult[]),
        ),
        mockCall('pool.dataset.query', [{
          id: '/mnt/pewl',
          locked: true,
          encryption_root: '/mnt/pewl',
        } as Dataset]),
      ]),
      mockProvider(SlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
      mockAuth(),
      mockProvider(Router),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads and shows the current list of pools to import when form is opened', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const controls = await form.getControlHarnessesDict();
    const optionLabels = await (controls['Pool'] as IxSelectHarness).getOptionLabels();

    expect(ws.job).toHaveBeenCalledWith('pool.import_find');
    expect(optionLabels).toEqual([
      'pool_name_1 | pool_guid_1',
      'pool_name_2 | pool_guid_2',
      'pool_name_3 | pool_guid_3',
    ]);
  });

  it('imports a pool when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Pool: 'pool_name_1 | pool_guid_1',
    });

    const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import' }));
    await importButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(ws.job).toHaveBeenCalledWith('pool.import_pool', [{ guid: 'pool_guid_1' }]);
  });

  it('checks if pool needs to be unlocked and prompts user to unlock it', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Pool: 'pool_name_1 | pool_guid_1',
    });

    const importButton = await loader.getHarness(MatButtonHarness.with({ text: 'Import' }));
    await importButton.click();

    expect(ws.call).toHaveBeenCalledWith('pool.dataset.query', [[['name', '=', 'pool_name_1']]]);
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Unlock Pool',
    }));

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/datasets', '/mnt/pewl', 'unlock']);
  });
});
