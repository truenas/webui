import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IscsiAuthMethod } from 'app/enums/iscsi.enum';
import { IscsiPortal } from 'app/interfaces/iscsi.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { PortalFormComponent } from './portal-form.component';

describe('PortalFormComponent', () => {
  let spectator: Spectator<PortalFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: PortalFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('iscsi.auth.query', [{
          id: 1,
          peersecret: '',
          peeruser: '',
          secret: '',
          tag: 1,
          user: 'root',
        }]),
        mockCall('iscsi.portal.listen_ip_choices', {
          '0.0.0.0': '0.0.0.0',
          '192.168.1.3': '192.168.1.3',
        }),
        mockCall('iscsi.portal.create'),
        mockCall('iscsi.portal.update'),
      ]),
      mockProvider(IxSlideInService),
      provideMockStore(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  describe('adding a new portal group', () => {
    it('sends an create payload to websocket and closes modal when save is pressed', async () => {
      const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
      await addButton.click();

      expect(spectator.query('.list-item')).toBeVisible();

      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Description: 'work',
        'Discovery Authentication Method': 'Mutual CHAP',
        'Discovery Authentication Group': '1',
        'IP Address': '192.168.1.3',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('iscsi.portal.create', [{
        comment: 'work',
        discovery_authgroup: 1,
        discovery_authmethod: IscsiAuthMethod.ChapMutual,
        listen: [{ ip: '192.168.1.3' }],
      }]);
    });
  });

  describe('editing a portal group', () => {
    beforeEach(() => {
      spectator.component.setupForm({
        comment: 'test',
        discovery_authgroup: 1,
        discovery_authmethod: IscsiAuthMethod.None,
        listen: [{ ip: '0.0.0.0' }],
        id: 1,
        tag: 1,
      } as IscsiPortal);
    });

    it('shows iscsi portal group values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Description: 'test',
        'Discovery Authentication Method': 'NONE',
        'Discovery Authentication Group': '1',
        'IP Address': '0.0.0.0',
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Description: 'good',
        'Discovery Authentication Method': 'CHAP',
        'Discovery Authentication Group': '1',
        'IP Address': '0.0.0.0',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('iscsi.portal.update', [1, {
        comment: 'good',
        discovery_authgroup: 1,
        discovery_authmethod: IscsiAuthMethod.Chap,
        listen: [{ ip: '0.0.0.0' }],
      }]);
    });
  });
});
