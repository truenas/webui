import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IscsiAuthMethod, IscsiTargetMode } from 'app/enums/iscsi.enum';
import {
  IscsiAuthAccess, IscsiInitiatorGroup, IscsiPortal, IscsiTarget,
} from 'app/interfaces/iscsi.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('TargetFormComponent', () => {
  let spectator: Spectator<TargetFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let websocket: WebSocketService;

  const existingTarget = {
    id: 123,
    name: 'name_test',
    alias: 'alias_test',
    mode: 'ISCSI',
    groups: [{
      portal: 1,
      initiator: 4,
      authmethod: IscsiAuthMethod.ChapMutual,
      auth: 66,
    },
    {
      portal: 2,
      initiator: 3,
      authmethod: IscsiAuthMethod.ChapMutual,
      auth: 55,
    }],
    auth_networks: ['192.168.10.0/24', '192.168.0.0/24'],
  } as IscsiTarget;

  const createComponent = createComponentFactory({
    component: TargetFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      FlexLayoutModule,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockProvider(DialogService),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockWebsocket([
        mockCall('iscsi.target.create'),
        mockCall('iscsi.target.update'),
        mockCall('iscsi.portal.query', [{
          comment: 'comment_1',
          id: 1,
          tag: 11,
          discovery_authgroup: 111,
          discovery_authmethod: IscsiAuthMethod.Chap,
          listen: [{ ip: '1.1.1.1' }],
        }, {
          comment: 'comment_2',
          id: 2,
          tag: 22,
          discovery_authgroup: 222,
          discovery_authmethod: IscsiAuthMethod.Chap,
          listen: [{ ip: '2.2.2.2' }],
        }] as IscsiPortal[]),
        mockCall('iscsi.initiator.query', [{
          id: 3,
          comment: 'comment_3',
          initiators: ['initiator_1'],
        }, {
          id: 4,
          comment: 'comment_4',
          initiators: ['initiator_2'],
        }] as IscsiInitiatorGroup[]),
        mockCall('iscsi.auth.query', [{
          id: 5,
          tag: 55,
          peersecret: 'peersecret_1',
          peeruser: 'peeruser_1',
          secret: 'secret_1',
          user: 'user_1',
        }, {
          id: 6,
          tag: 66,
          peersecret: 'peersecret_2',
          peeruser: 'peeruser_2',
          secret: 'secret_2',
          user: 'user_2',
        }] as IscsiAuthAccess[]),
      ]),
    ],
  });

  describe('adds new target', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      websocket = spectator.inject(WebSocketService);
    });

    it('add new target when form is submitted', async () => {
      const addButtons = await loader.getAllHarnesses(MatButtonHarness.with({ text: 'Add' }));
      await addButtons[0].click();
      await addButtons[0].click();
      await addButtons[1].click();
      await addButtons[1].click();

      spectator.component.form.patchValue({
        name: 'name_new',
        alias: 'alias_new',
        mode: IscsiTargetMode.Iscsi,
        groups: [
          {
            portal: 11,
            initiator: 12,
            authmethod: IscsiAuthMethod.ChapMutual,
            auth: 13,
          },
          {
            portal: 21,
            initiator: 22,
            authmethod: IscsiAuthMethod.Chap,
            auth: 23,
          },
        ],
        auth_networks: ['10.0.0.0/8', '11.0.0.0/8'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(websocket.call).toHaveBeenCalledWith('iscsi.target.create', [{
        name: 'name_new',
        alias: 'alias_new',
        mode: 'ISCSI',
        groups: [
          {
            portal: 11,
            initiator: 12,
            authmethod: IscsiAuthMethod.ChapMutual,
            auth: 13,
          },
          {
            portal: 21,
            initiator: 22,
            authmethod: IscsiAuthMethod.Chap,
            auth: 23,
          },
        ],
        auth_networks: ['10.0.0.0/8', '11.0.0.0/8'],
      }]);
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('edit new target', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: existingTarget },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      websocket = spectator.inject(WebSocketService);
    });

    it('edits existing target when form opened for edit is submitted', async () => {
      await form.fillForm({
        'Target Name': 'name_new',
        'Target Alias': 'alias_new',
        'Target Mode': 'iSCSI',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(websocket.call).toHaveBeenLastCalledWith(
        'iscsi.target.update',
        [
          123,
          {
            name: 'name_new',
            alias: 'alias_new',
            mode: 'ISCSI',
            groups: [
              {
                portal: 1,
                initiator: 4,
                authmethod: IscsiAuthMethod.ChapMutual,
                auth: 66,
              },
              {
                portal: 2,
                initiator: 3,
                authmethod: IscsiAuthMethod.ChapMutual,
                auth: 55,
              },
            ],
            auth_networks: ['192.168.10.0/24', '192.168.0.0/24'],
          },
        ],
      );
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
    });

    it('loads and shows the \'portal\', \'initiator\' and \'auth\'', () => {
      let portal; let initiator; let auth: Option[];
      spectator.component.portals$.subscribe((options) => portal = options);
      spectator.component.initiators$.subscribe((options) => initiator = options);
      spectator.component.auths$.subscribe((options) => auth = options);

      expect(websocket.call).toHaveBeenNthCalledWith(1, 'iscsi.portal.query', []);
      expect(websocket.call).toHaveBeenNthCalledWith(2, 'iscsi.initiator.query', []);
      expect(websocket.call).toHaveBeenNthCalledWith(3, 'iscsi.auth.query', []);

      expect(portal).toEqual([
        { label: '11 (comment_1)', value: 1 },
        { label: '22 (comment_2)', value: 2 },
      ]);

      expect(initiator).toEqual([
        { label: '3 (initiator_1)', value: 3 },
        { label: '4 (initiator_2)', value: 4 },
      ]);

      expect(auth).toEqual([
        { label: '55', value: 55 },
        { label: '66', value: 66 },
      ]);
    });
  });
});
