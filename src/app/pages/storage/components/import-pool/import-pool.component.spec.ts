import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockEntityJobComponentRef } from 'app/core/testing/utils/mock-entity-job-component-ref.utils';
import { mockJob, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { PoolFindResult } from 'app/interfaces/pool-import.interface';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { ImportPoolComponent } from './import-pool.component';

describe('ImportPoolComponent', () => {
  let spectator: Spectator<ImportPoolComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: ImportPoolComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockJob('pool.import_pool', fakeSuccessfulJob()),
        mockJob('pool.import_find',
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
          }] as PoolFindResult[])),
      ]),
      mockProvider(IxSlideInRef),
      mockProvider(DialogService),
      mockProvider(MatDialog, {
        open: () => mockEntityJobComponentRef,
      }),
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

    expect(mockEntityJobComponentRef.componentInstance.setCall).toHaveBeenCalledWith('pool.import_pool', [{ guid: 'pool_guid_1' }]);
  });
});
