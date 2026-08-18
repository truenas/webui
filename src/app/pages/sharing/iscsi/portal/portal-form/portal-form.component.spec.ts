import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import {
  TnButtonHarness, TnIconButtonHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiAuthMethod } from 'app/enums/iscsi.enum';
import { IscsiPortal } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import { PortalFormComponent } from './portal-form.component';

describe('PortalFormComponent', () => {
  let spectator: Spectator<PortalFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const editingPortal = {
    comment: 'test',
    listen: [{ ip: '0.0.0.0' }],
    id: 1,
    tag: 1,
  } as IscsiPortal;

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const createComponent = createComponentFactory({
    component: PortalFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('iscsi.auth.query', [{
          id: 1,
          peersecret: '',
          peeruser: '',
          secret: '',
          tag: 1,
          user: 'root',
          discovery_auth: IscsiAuthMethod.None,
        }]),
        mockCall('iscsi.portal.listen_ip_choices', {
          '0.0.0.0': '0.0.0.0',
          '192.168.1.3': '192.168.1.3',
        }),
        mockCall('iscsi.portal.create'),
        mockCall('iscsi.portal.update'),
      ]),
      mockProvider(DialogService),
      provideMockStore(),
      ...ixFormTestingProviders(),
    ],
  });

  describe('adding a new portal group', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
      jest.spyOn(console, 'warn').mockImplementation();
    });

    it('sends a create payload to websocket and closes when the host submits the form', async () => {
      const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
      await addButton.click();

      const list = await loader.getHarness(IxListHarness);
      expect(await list.getListItems()).toHaveLength(1);

      await (await getTnInput('comment')).setValue('work');

      const ipSelect = await loader.getHarness(TnSelectHarness);
      await ipSelect.selectOption('192.168.1.3');

      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('iscsi.portal.create', [{
        comment: 'work',
        listen: [{ ip: '192.168.1.3' }],
      }]);
      expect(closed).toHaveBeenCalledWith(true);
    });
  });

  describe('editing a portal group', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          portalData: editingPortal,
        },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
      jest.spyOn(console, 'warn').mockImplementation();
    });

    it('shows iscsi portal group values when form is being edited', async () => {
      expect(await (await getTnInput('comment')).getValue()).toBe('test');

      const ipSelect = await loader.getHarness(TnSelectHarness);
      expect(await ipSelect.getDisplayText()).toBe('0.0.0.0');
    });

    it('sends an update payload to websocket and closes when the host submits the form', async () => {
      await (await getTnInput('comment')).setValue('good');

      const ipSelect = await loader.getHarness(TnSelectHarness);
      await ipSelect.selectOption('0.0.0.0');

      const closed = jest.fn();
      spectator.component.closed.subscribe(closed);

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('iscsi.portal.update', [1, {
        comment: 'good',
        listen: [{ ip: '0.0.0.0' }],
      }]);
      expect(closed).toHaveBeenCalledWith(true);
    });
  });

  describe('checking the addition and removal of IP addresses', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
      jest.spyOn(console, 'warn').mockImplementation();
    });

    it('adds and removes blocks when Add or Delete button is pressed', async () => {
      const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
      const list = await loader.getHarness(IxListHarness);
      let deleteButton: TnIconButtonHarness;
      expect(await list.getListItems()).toHaveLength(0);
      expect(spectator.component.form.value.ip).toHaveLength(0);

      await addButton.click();
      expect(await list.getListItems()).toHaveLength(1);
      expect(spectator.component.form.value.ip).toHaveLength(1);

      await addButton.click();
      expect(await list.getListItems()).toHaveLength(2);
      expect(spectator.component.form.value.ip).toHaveLength(2);

      deleteButton = await loader.getHarness(TnIconButtonHarness.with({ selector: '.delete-btn' }));
      await deleteButton.click();
      expect(await list.getListItems()).toHaveLength(1);
      expect(spectator.component.form.value.ip).toHaveLength(1);

      deleteButton = await loader.getHarness(TnIconButtonHarness.with({ selector: '.delete-btn' }));
      await deleteButton.click();
      expect(await list.getListItems()).toHaveLength(0);
      expect(spectator.component.form.value.ip).toHaveLength(0);
    });
  });
});
