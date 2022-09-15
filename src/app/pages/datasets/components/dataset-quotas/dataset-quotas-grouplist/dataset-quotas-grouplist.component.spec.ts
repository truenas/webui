import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TemplateRef } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  BehaviorSubject, of, Subject,
} from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';
import {
  AppLoaderService, DialogService, StorageService, WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { DatasetQuotasGrouplistComponent } from './dataset-quotas-grouplist.component';

export const fakeGroupQuotas: DatasetQuota[] = [{
  id: 1,
  name: 'daemon',
  obj_quota: 0,
  obj_used: 0,
  obj_used_percent: 0,
  quota: 512000,
  quota_type: DatasetQuotaType.Group,
  used_bytes: 0,
  used_percent: 0,
}, {
  id: 2,
  name: 'bin',
  obj_quota: 0,
  obj_used: 0,
  obj_used_percent: 0,
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
      mockProvider(AppLoaderService),
      mockProvider(FormErrorHandlerService),
      mockProvider(WebSocketService),
      mockProvider(StorageService, {
        convertBytesToHumanReadable: jest.fn(() => '500 KiB'),
      }),
      mockProvider(ActivatedRoute, {
        snapshot: { params: { datasetId: 'Test' } },
      }),
      mockProvider(LayoutService, {
        pageHeaderUpdater$: new BehaviorSubject<TemplateRef<unknown>>(null),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        onClose$: new Subject<unknown>(),
        open: jest.fn(),
      }),
      mockWebsocket([
        mockCall('pool.dataset.get_quota', fakeGroupQuotas),
        mockCall('pool.dataset.set_quota'),
      ]),
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
      ['Test', DatasetQuotaType.Group, [['OR', [['quota', '>', 0], ['obj_quota', '>', 0]]]]],
    );

    expect(ws.call).toHaveBeenCalledWith(
      'pool.dataset.get_quota',
      ['Test', DatasetQuotaType.Group, [['name', '=', null]]],
    );

    const table = await loader.getHarness(IxTableHarness);
    const cells = await table.getCells(true);
    const expectedRows = [
      ['Name', 'ID', 'Data Quota', 'DQ Used', 'DQ % Used', 'Object Quota', 'OQ Used', 'OQ % Used', ''],
      ['daemon', '1', '500 KiB', '0', '0%', '0', '0', '0%', 'delete'],
      ['bin', '2', '500 KiB', '0', '0%', '0', '0', '0%', 'delete'],
    ];

    expect(cells).toEqual(expectedRows);
  });

  it('should delete group quota when click delete button', async () => {
    const [firstDeleteButton] = await loader.getAllHarnesses(MatButtonHarness.with({ text: 'delete' }));
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
    const [firstRow] = element.querySelectorAll('.mat-row');
    (firstRow as HTMLElement).click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(DatasetQuotaEditFormComponent);
  });
});
