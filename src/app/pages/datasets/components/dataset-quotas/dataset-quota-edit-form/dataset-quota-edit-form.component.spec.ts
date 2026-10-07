import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall, mockTypedQuery } from 'app/core/testing/utils/mock-typed-api.utils';
import { DatasetQuotaType } from 'app/enums/dataset.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { WebUiQueryEntity } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { DatasetQuotaEditFormComponent } from 'app/pages/datasets/components/dataset-quotas/dataset-quota-edit-form/dataset-quota-edit-form.component';

describe('DatasetQuotaEditFormComponent', () => {
  let spectator: Spectator<DatasetQuotaEditFormComponent>;
  let loader: HarnessLoader;
  let api: TypedApiService;

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: DatasetQuotaEditFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockTypedApi([
        // Not a `.query` method, but it has an entity, so the fake answers it as one.
        mockTypedQuery('pool.dataset.get_quota', [{
          id: 1,
          name: 'daemon',
          quota: 512000,
          obj_quota: 0,
        }] as unknown as WebUiQueryEntity<'pool.dataset.get_quota'>[]),
        mockTypedCall('pool.dataset.set_quota', null),
      ]),
      mockProvider(DialogService),
      ...ixFormTestingProviders(),
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
      api = spectator.inject(TypedApiService);
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
      await spectator.fixture.whenStable();

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
      api = spectator.inject(TypedApiService);
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
      await spectator.fixture.whenStable();

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
      api = spectator.inject(TypedApiService);
      dialogService = spectator.inject(DialogService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('asks for confirmation when both quotas are cleared', async () => {
      const confirmSpy = jest.spyOn(dialogService, 'confirm').mockReturnValue(of(true));
      await (await getTnInput('data_quota')).setValue('0');

      spectator.component.submit();
      await spectator.fixture.whenStable();

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
      await spectator.fixture.whenStable();

      expect(dialogService.confirm).toHaveBeenCalled();
      expect(api.call).not.toHaveBeenCalledWith('pool.dataset.set_quota', expect.anything());
      expect(closed).not.toHaveBeenCalled();
    });
  });
});
