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
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { IxTableModule } from 'app/modules/ix-tables/ix-table.module';
import { IxTableHarness } from 'app/modules/ix-tables/testing/ix-table.harness';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';
import {
  AppLoaderService, DialogService, WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { LayoutService } from 'app/services/layout.service';
import { DatasetQuotasUserlistComponent } from './dataset-quotas-userlist.component';

const fakeUserQuotas: DatasetQuota[] = [{
  id: 1,
  name: 'daemon',
  obj_quota: 0,
  obj_used: 0,
  quota: 512000,
  quota_type: DatasetQuotaType.User,
  used_bytes: 0,
  used_percent: 0,
}, {
  id: 2,
  name: 'bin',
  obj_quota: 0,
  obj_used: 0,
  quota: 512000,
  quota_type: DatasetQuotaType.User,
  used_bytes: 0,
  used_percent: 0,
}];

describe('DatasetQuotasUserlistComponent', () => {
  let spectator: Spectator<DatasetQuotasUserlistComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: DatasetQuotasUserlistComponent,
    imports: [
      EntityModule,
      IxTableModule,
    ],
    providers: [
      mockProvider(AppLoaderService),
      mockProvider(FormErrorHandlerService),
      mockProvider(WebSocketService),
      mockProvider(IxFormatterService, {
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
        open: jest.fn(() => ({
          slideInClosed$: of(undefined),
        })),
      }),
      mockWebsocket([
        mockCall('pool.dataset.get_quota', fakeUserQuotas),
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
      ['Test', DatasetQuotaType.User, []],
    );

    expect(ws.call).toHaveBeenCalledWith(
      'pool.dataset.get_quota',
      ['Test', DatasetQuotaType.User, [['name', '=', null]]],
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

  it('should delete user quota when click delete button', async () => {
    const [firstDeleteButton] = await loader.getAllHarnesses(MatButtonHarness.with({ selector: '[aria-label="Delete"]' }));
    await firstDeleteButton.click();

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
    const element = await spectator.fixture.nativeElement as HTMLElement;
    const [, secondRow] = element.querySelectorAll('.mat-mdc-row');
    (secondRow as HTMLElement).click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(
      DatasetQuotaEditFormComponent, { data: { datasetId: 'Test', id: 2, quotaType: 'USER' } },
    );
  });
});
