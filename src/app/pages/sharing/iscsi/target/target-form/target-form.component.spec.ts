import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiAuthMethod, IscsiTargetMode } from 'app/enums/iscsi.enum';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import {
  IscsiAuthAccess, IscsiInitiatorGroup, IscsiPortal, IscsiTarget,
} from 'app/interfaces/iscsi.interface';
import { Option } from 'app/interfaces/option.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import {
  IxIpInputWithNetmaskComponent,
} from 'app/modules/forms/ix-forms/components/ix-ip-input-with-netmask/ix-ip-input-with-netmask.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('TargetFormComponent', () => {
  let spectator: Spectator<TargetFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let api: ApiService;

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
      ReactiveFormsModule,
      IxIpInputWithNetmaskComponent,
    ],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectSystemInfo,
            value: {
              version: 'TrueNAS-SCALE-22.12',
              license: {
                features: [LicenseFeature.FibreChannel],
              },
            } as SystemInfo,
          },
        ],
      }),
      mockProvider(SlideInService),
      mockProvider(DialogService),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockApi([
        mockCall('iscsi.target.create'),
        mockCall('iscsi.target.update'),
        mockCall('iscsi.target.validate_name', null),
        mockCall('fc.capable', true),
        mockCall('iscsi.portal.query', [{
          comment: 'comment_1',
          id: 1,
          tag: 11,
          listen: [{ ip: '1.1.1.1' }],
        }, {
          comment: 'comment_2',
          id: 2,
          tag: 22,
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
      mockAuth(),
    ],
  });

  describe('adds new target', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
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

      expect(api.call).toHaveBeenCalledWith('iscsi.target.create', [{
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
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
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
      api = spectator.inject(ApiService);
    });

    it('edits existing target when form opened for edit is submitted', async () => {
      await form.fillForm({
        'Target Name': 'name_new',
        'Target Alias': 'alias_new',
        Mode: 'Fibre Channel',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenLastCalledWith(
        'iscsi.target.update',
        [
          123,
          {
            name: 'name_new',
            alias: 'alias_new',
            mode: IscsiTargetMode.Fc,
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
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });

    it('loads and shows the \'portal\', \'initiator\' and \'auth\'', () => {
      let portal;
      let initiator;
      let auth: Option[];

      spectator.component.portals$.subscribe((options) => portal = options);
      spectator.component.initiators$.subscribe((options) => initiator = options);
      spectator.component.auths$.subscribe((options) => auth = options);

      expect(api.call).toHaveBeenNthCalledWith(1, 'fc.capable');
      expect(api.call).toHaveBeenNthCalledWith(2, 'iscsi.portal.query', []);
      expect(api.call).toHaveBeenNthCalledWith(3, 'iscsi.initiator.query', []);
      expect(api.call).toHaveBeenNthCalledWith(4, 'iscsi.auth.query', []);

      expect(spectator.component.hasFibreChannel()).toBe(true);

      expect(portal).toEqual([
        { label: '1 (comment_1)', value: 1 },
        { label: '2 (comment_2)', value: 2 },
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

  describe('validation error handling', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    beforeEach(async () => {
      spectator = createComponent();
      api = spectator.inject(ApiService);
      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'iscsi.target.validate_name') {
          return of('Target with this name already exists');
        }
        return null;
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('should display an error message for invalid target name', async () => {
      await form.fillForm({
        'Target Name': 'name_test',
      });

      const nameControl = await loader.getHarness(IxInputHarness.with({ label: 'Target Name' }));
      expect(await nameControl.getErrorText()).toBe('Target with this name already exists');
    });
  });
});
