import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DatasetQuota } from 'app/interfaces/dataset-quota.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';

describe('DatasetQuotaEditFormComponent', () => {
  let spectator: Spectator<DatasetQuotaEditFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: DatasetQuotaEditFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('pool.dataset.get_quota', [{
          id: 1,
          name: 'daemon',
          quota: 512000,
          obj_quota: 0,
        } as DatasetQuota]),
        mockCall('pool.dataset.set_quota'),
      ]),
      mockProvider(DialogService),
      ...ixFormTestingProviders(),
      // Panel host: skip the minimum-feedback delay so the close is observable synchronously.
      { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
      mockAuth(),
    ],
  });

  describe('editing user quota', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          quotaType: DatasetQuotaType.User,
          datasetId: 'Test',
          quotaId: 1,
        },
      });
      api = spectator.inject(ApiService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows current quota values when editing', async () => {
      expect(api.call).toHaveBeenCalledWith(
        'pool.dataset.get_quota',
        ['Test', DatasetQuotaType.User, [['id', '=', 1]]],
      );

      expect(await (await getTnInput('name')).getValue()).toBe('daemon');
      expect(await (await getTnInput('data_quota')).getValue()).toBe('500 KiB');
      expect(await (await getTnInput('obj_quota')).getValue()).toBe('0');
    });

    it('sends an update payload to websocket when save is pressed', async () => {
      await (await getTnInput('data_quota')).setValue('1000 KiB');

      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);
      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('pool.dataset.set_quota', ['Test', [
        {
          quota_type: DatasetQuotaType.User,
          id: '1',
          quota_value: 1024000,
        },
        {
          quota_type: DatasetQuotaType.UserObj,
          id: '1',
          quota_value: 0,
        },
      ]]);
      expect(closed).toHaveBeenCalledWith(true);
    });
  });

  describe('editing group quota', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          quotaType: DatasetQuotaType.Group,
          datasetId: 'Test',
          quotaId: 1,
        },
      });
      api = spectator.inject(ApiService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows current quota values when editing', async () => {
      expect(api.call).toHaveBeenCalledWith(
        'pool.dataset.get_quota',
        ['Test', DatasetQuotaType.Group, [['id', '=', 1]]],
      );

      expect(await (await getTnInput('name')).getValue()).toBe('daemon');
      expect(await (await getTnInput('data_quota')).getValue()).toBe('500 KiB');
      expect(await (await getTnInput('obj_quota')).getValue()).toBe('0');
    });

    it('sends an update payload to websocket when save is pressed', async () => {
      await (await getTnInput('obj_quota')).setValue('1');

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('pool.dataset.set_quota', ['Test', [
        {
          quota_type: DatasetQuotaType.Group,
          id: '1',
          quota_value: 512000,
        },
        {
          quota_type: DatasetQuotaType.GroupObj,
          id: '1',
          quota_value: 1,
        },
      ]]);
    });
  });

  describe('unsetting both quotas', () => {
    let dialogService: DialogService;

    beforeEach(() => {
      spectator = createComponent({
        props: {
          quotaType: DatasetQuotaType.User,
          datasetId: 'Test',
          quotaId: 1,
        },
      });
      api = spectator.inject(ApiService);
      dialogService = spectator.inject(DialogService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('asks for confirmation when both quotas are cleared', async () => {
      const confirmSpy = jest.spyOn(dialogService, 'confirm').mockReturnValue(of(true));
      await (await getTnInput('data_quota')).setValue('0');

      spectator.component.submit();

      expect(confirmSpy).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Delete User Quota',
      }));
      expect(api.call).toHaveBeenCalledWith('pool.dataset.set_quota', expect.anything());
    });

    it('does not update the quota when the confirmation is declined', async () => {
      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);
      jest.spyOn(dialogService, 'confirm').mockReturnValue(of(false));
      await (await getTnInput('data_quota')).setValue('0');

      spectator.component.submit();

      expect(dialogService.confirm).toHaveBeenCalled();
      expect(api.call).not.toHaveBeenCalledWith('pool.dataset.set_quota', expect.anything());
      expect(closed).not.toHaveBeenCalled();
    });
  });
});
