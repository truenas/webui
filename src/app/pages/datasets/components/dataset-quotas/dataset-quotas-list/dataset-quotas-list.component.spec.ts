import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ActivatedRoute } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnIconButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetQuotaAddFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-add-form/dataset-quota-add-form.component';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';
import { DatasetQuotasListComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quotas-list/dataset-quotas-list.component';

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
  let api: ApiService;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: DatasetQuotasListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
    ],
    providers: [
      mockProvider(LoaderService),
      mockProvider(FormErrorHandlerService),
      mockProvider(ApiService),
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
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockApi([
        mockCall('pool.dataset.get_quota', fakeQuotas),
        mockCall('pool.dataset.set_quota'),
      ]),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(api.call).toHaveBeenCalledWith(
      'pool.dataset.get_quota',
      ['Test', DatasetQuotaType.User, []],
    );

    expect(api.call).toHaveBeenCalledWith(
      'pool.dataset.get_quota',
      ['Test', DatasetQuotaType.User, [['name', '=', null]]],
    );

    expect(await table.getRowCount()).toBe(2);
    expect(await table.getRowTexts(0)).toEqual(
      ['daemon', '1', '500 KiB', '—', '25%', '5', '55', '11%', ''],
    );
    expect(await table.getRowTexts(1)).toEqual(
      ['bin', '2', '500 KiB', '—', '0%', '—', '33', '—', ''],
    );
  });

  it('should delete user quota when click delete button', async () => {
    const deleteButtons = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-delete' }));
    await deleteButtons[0].click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Delete User Quota',
      }),
    );
    expect(api.call).toHaveBeenCalledWith(
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

  it('opens side panel to edit user quota when edit button is pressed', async () => {
    const editButtons = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-pencil' }));
    await editButtons[1].click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      DatasetQuotaEditFormComponent,
      {
        title: 'Edit User Quota',
        inputs: { datasetId: 'Test', quotaType: DatasetQuotaType.User, quotaId: 2 },
      },
    );
  });

  it('opens side panel when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      DatasetQuotaAddFormComponent,
      {
        title: 'Add User Quotas',
        inputs: { datasetId: 'Test', quotaType: DatasetQuotaType.User },
      },
    );
  });
});
