import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockModule } from 'ng-mocks';
import { of, Subject } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { DatasetQuotaAddFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-add-form/dataset-quota-add-form.component';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';
import { DatasetQuotasListComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quotas-list/dataset-quotas-list.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

const fakeQuotas = [{
  id: 1,
  name: 'daemon',
  obj_quota: 5,
  obj_used: 55,
  quota: 512000,
  quota_type: DatasetQuotaType.User,
  used_percent: 25,
}, {
  id: 2,
  name: 'bin',
  obj_quota: 0,
  obj_used: 33,
  quota: 512000,
  quota_type: DatasetQuotaType.User,
  used_percent: 0,
}] as DatasetQuota[];

describe('DatasetQuotasListComponent', () => {
  let spectator: Spectator<DatasetQuotasListComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let table: IxTable2Harness;

  const createComponent = createComponentFactory({
    component: DatasetQuotasListComponent,
    imports: [
      IxTable2Module,
      MockModule(PageHeaderModule),
      SearchInput1Component,
    ],
    providers: [
      mockProvider(AppLoaderService),
      mockProvider(FormErrorHandlerService),
      mockProvider(WebSocketService),
      mockProvider(IxFormatterService, {
        convertBytesToHumanReadable: jest.fn(() => '500 KiB'),
      }),
      mockProvider(ActivatedRoute, {
        snapshot: {
          params: {
            datasetId: 'Test',
          },
        },
        data: of({
          quotaType: DatasetQuotaType.User,
          quotaObjType: DatasetQuotaType.UserObj,
          helpTextKey: 'users',
        }),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        onClose$: new Subject<unknown>(),
        open: jest.fn(() => ({
          slideInClosed$: of(undefined),
        })),
      }),
      mockWebSocket([
        mockCall('pool.dataset.get_quota', fakeQuotas),
        mockCall('pool.dataset.set_quota'),
      ]),
      mockProvider(IxSlideInRef),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    expect(ws.call).toHaveBeenCalledWith(
      'pool.dataset.get_quota',
      ['Test', DatasetQuotaType.User, []],
    );

    expect(ws.call).toHaveBeenCalledWith(
      'pool.dataset.get_quota',
      ['Test', DatasetQuotaType.User, [['name', '=', null]]],
    );

    const cells = await table.getCellTexts();

    const expectedRows = [
      ['Name', 'ID', 'Data Quota', 'DQ Used', 'DQ % Used', 'Object Quota', 'OQ Used', 'OQ % Used', ''],
      ['daemon', '1', '500 KiB', '—', '25%', '5', '55', '11%', ''],
      ['bin', '2', '500 KiB', '—', '0%', '—', '33', '—', ''],
    ];

    expect(cells).toEqual(expectedRows);
  });

  it('should delete user quota when click delete button', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 8);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Delete User Quota',
      }),
    );
    expect(ws.call).toHaveBeenCalledWith(
      'pool.dataset.set_quota',
      ['Test', [{
        id: '1',
        quota_type: DatasetQuotaType.User,
        quota_value: 0,
      }, {
        id: '1',
        quota_type: DatasetQuotaType.UserObj,
        quota_value: 0,
      }]],
    );
  });

  it('should open slide to edit user quota when click a row', async () => {
    const editIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 2, 8);
    await editIcon.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(
      DatasetQuotaEditFormComponent,
      { data: { datasetId: 'Test', id: 2, quotaType: 'USER' } },
    );
  });

  it('opens form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(
      DatasetQuotaAddFormComponent,
      { data: { datasetId: 'Test', quotaType: 'USER' } },
    );
  });
});
