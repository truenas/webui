import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IscsiAuthMethod } from 'app/enums/iscsi.enum';
import {
  IscsiAuthAccess, IscsiInitiatorGroup, IscsiPortal, IscsiTarget,
} from 'app/interfaces/iscsi.interface';
import { Option } from 'app/interfaces/option.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('TargetFormComponent', () => {
  let spectator: Spectator<TargetFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

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
      mockWebsocket([
        mockCall('iscsi.target.create'),
        mockCall('iscsi.target.update'),
        mockCall('iscsi.portal.query', [{
          comment: 'comment_1',
          id: 1,
          tag: 11,
          discovery_authgroup: 111,
          discovery_authmethod: IscsiAuthMethod.Chap,
          listen: [{
            ip: '1.1.1.1',
            port: 1111,
          }],
        }, {
          comment: 'comment_2',
          id: 2,
          tag: 22,
          discovery_authgroup: 222,
          discovery_authmethod: IscsiAuthMethod.Chap,
          listen: [{
            ip: '2.2.2.2',
            port: 2222,
          }],
        }] as IscsiPortal[]),
        mockCall('iscsi.initiator.query', [{
          id: 3,
          comment: 'comment_3',
          auth_network: [],
          initiators: 'initiator_1',
        }, {
          id: 4,
          comment: 'comment_4',
          auth_network: [],
          initiators: 'initiator_2',
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

  beforeEach(async () => {
    spectator = createComponent();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('add new target when form is submitted', async () => {
    await form.fillForm({
      'Target Name': 'name_new',
      'Target Alias': 'alias_new',
      'Target Mode': 'iSCSI',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('iscsi.target.create', [{
      name: 'name_new',
      alias: 'alias_new',
      mode: 'ISCSI',
      groups: [],
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('edits existing target when form opened for edit is submitted', async () => {
    spectator.component.setTargetForEdit(existingTarget);

    await form.fillForm({
      'Target Name': 'name_new',
      'Target Alias': 'alias_new',
      'Target Mode': 'iSCSI',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith(
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
        },
      ],
    );
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('loads and shows the \'portal\', \'initiator\' and \'auth\'', () => {
    spectator.component.setTargetForEdit(existingTarget);

    let portal; let initiator; let auth: Option[];
    spectator.component.portals$.subscribe((options) => portal = options);
    spectator.component.initiators$.subscribe((options) => initiator = options);
    spectator.component.auths$.subscribe((options) => auth = options);

    expect(spectator.inject(WebSocketService).call).toHaveBeenNthCalledWith(1, 'iscsi.portal.query', []);
    expect(spectator.inject(WebSocketService).call).toHaveBeenNthCalledWith(2, 'iscsi.initiator.query', []);
    expect(spectator.inject(WebSocketService).call).toHaveBeenNthCalledWith(3, 'iscsi.auth.query', []);

    expect(portal).toEqual([
      { label: '---', value: null },
      { label: '11 (comment_1)', value: 1 },
      { label: '22 (comment_2)', value: 2 },
    ]);

    expect(initiator).toEqual([
      { label: 'None', value: null },
      { label: '3 (initiator_1)', value: 3 },
      { label: '4 (initiator_2)', value: 4 },
    ]);

    expect(auth).toEqual([
      { label: 'None', value: null },
      { label: '55', value: 55 },
      { label: '66', value: 66 },
    ]);
  });
});
