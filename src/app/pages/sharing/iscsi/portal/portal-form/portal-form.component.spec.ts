import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiAuthMethod } from 'app/enums/iscsi.enum';
import { IscsiPortal } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { PortalFormComponent } from './portal-form.component';

describe('PortalFormComponent', () => {
  let spectator: Spectator<PortalFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const slideInRef: SlideInRef<IscsiPortal | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const editingPortal = {
    comment: 'test',
    listen: [{ ip: '0.0.0.0' }],
    id: 1,
    tag: 1,
  } as IscsiPortal;

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
      mockProvider(SlideIn, {
        components$: of([]),
      }),
      mockProvider(DialogService),
      provideMockStore(),
      mockProvider(SlideInRef, slideInRef),
    ],
  });

  describe('adding a new portal group', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('sends an create payload to websocket and closes modal when save is pressed', async () => {
      const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
      await addButton.click();

      expect(spectator.query('.list-item')).toBeVisible();

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Description: 'work',
        'IP Address': '192.168.1.3',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('iscsi.portal.create', [{
        comment: 'work',
        listen: [{ ip: '192.168.1.3' }],
      }]);
    });
  });

  describe('editing a portal group', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => editingPortal }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows iscsi portal group values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Description: 'test',
        'IP Address': '0.0.0.0',
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Description: 'good',
        'IP Address': '0.0.0.0',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('iscsi.portal.update', [1, {
        comment: 'good',
        listen: [{ ip: '0.0.0.0' }],
      }]);
    });
  });

  describe('checking the addition and removal of IP addresses', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('adds and removes blocks when Add or Delete button is pressed', async () => {
      const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
      let deleteButton: MatButtonHarness;
      expect(spectator.queryAll('.list-item')).toHaveLength(0);
      expect(spectator.component.form.value.ip).toHaveLength(0);

      await addButton.click();
      expect(spectator.queryAll('.list-item')).toHaveLength(1);
      expect(spectator.component.form.value.ip).toHaveLength(1);

      await addButton.click();
      expect(spectator.queryAll('.list-item')).toHaveLength(2);
      expect(spectator.component.form.value.ip).toHaveLength(2);

      deleteButton = await loader.getHarness(MatButtonHarness.with({ selector: '.delete-btn' }));
      await deleteButton.click();
      expect(spectator.queryAll('.list-item')).toHaveLength(1);
      expect(spectator.component.form.value.ip).toHaveLength(1);

      deleteButton = await loader.getHarness(MatButtonHarness.with({ selector: '.delete-btn' }));
      await deleteButton.click();
      expect(spectator.queryAll('.list-item')).toHaveLength(0);
      expect(spectator.component.form.value.ip).toHaveLength(0);
    });
  });
});
