import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { DatasetQuotasGrouplistComponent } from './dataset-quotas-grouplist.component';

const fakeGroupQuotas: DatasetQuota[] = [{
  id: 1,
  name: 'daemon',
  obj_quota: 0,
  obj_used: 0,
  quota: 512000,
  quota_type: DatasetQuotaType.Group,
  used_bytes: 0,
  used_percent: 0,
}, {
  id: 2,
  name: 'bin',
  obj_quota: 0,
  obj_used: 0,
  quota: 512000,
  quota_type: DatasetQuotaType.Group,
  used_bytes: 0,
  used_percent: 0,
}];

describe('DatasetQuotasGrouplistComponent', () => {
  let spectator: Spectator<DatasetQuotasGrouplistComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: DatasetQuotasGrouplistComponent,
    imports: [
      EntityModule,
      IxTableModule,
    ],
    providers: [
      mockProvider(FormErrorHandlerService),
      mockProvider(WebSocketService),
      mockProvider(IxFormatterService, {
        convertBytesToHumanReadable: jest.fn(() => '500 KiB'),
      }),
      mockProvider(ActivatedRoute, {
        snapshot: { params: { datasetId: 'Test' } },
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        onClose$: new Subject<unknown>(),
        open: jest.fn(() => ({ slideInClosed$: of() })),
      }),
      mockWebsocket([
        mockCall('pool.dataset.get_quota', fakeGroupQuotas),
        mockCall('pool.dataset.set_quota'),
      ]),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('should show table rows', async () => {
    expect(ws.call).toHaveBeenCalledWith(
      'pool.dataset.get_quota',
      ['Test', DatasetQuotaType.Group, []],
    );

    expect(ws.call).toHaveBeenCalledWith(
      'pool.dataset.get_quota',
      ['Test', DatasetQuotaType.Group, [['name', '=', null]]],
    );

    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCells(true);
    const expectedRows = [
      ['Name', 'ID', 'Data Quota', 'DQ Used', 'DQ % Used', 'Object Quota', 'OQ Used', 'OQ % Used', ''],
      ['daemon', '1', '500 KiB', '0', '0%', '—', '0', '—', ''],
      ['bin', '2', '500 KiB', '0', '0%', '—', '0', '—', ''],
    ];

    expect(cells).toEqual(expectedRows);
  });

  it('should delete group quota when click delete button', async () => {
    const [firstDeleteButton] = await loader.getAllHarnesses(MatButtonHarness.with({ selector: '[aria-label="Delete"]' }));
    await firstDeleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Delete Group Quota',
      }),
    );
    expect(ws.call).toHaveBeenCalledWith(
      'pool.dataset.set_quota',
      ['Test', [{
        id: '1',
        quota_type: DatasetQuotaType.Group,
        quota_value: 0,
      }, {
        id: '1',
        quota_type: DatasetQuotaType.GroupObj,
        quota_value: 0,
      }]],
    );
  });

  it('should open slide to edit group quota when click a row', async () => {
    const element = await spectator.fixture.nativeElement as HTMLElement;
    const [firstRow] = element.querySelectorAll('.mat-mdc-row');
    (firstRow as HTMLElement).click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(
      DatasetQuotaEditFormComponent, { data: { datasetId: 'Test', id: 1, quotaType: 'GROUP' } },
    );
  });
});
