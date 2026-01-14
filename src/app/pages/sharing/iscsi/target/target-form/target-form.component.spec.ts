import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
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
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  FcMpioInfoBannerComponent,
} from 'app/pages/sharing/iscsi/fibre-channel-ports/fc-mpio-info-banner/fc-mpio-info-banner.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { FibreChannelService } from 'app/services/fibre-channel.service';
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
    mode: IscsiTargetMode.Iscsi,
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

  const slideInRef: SlideInRef<IscsiTarget | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: TargetFormComponent,
    imports: [
      ReactiveFormsModule,
      IxIpInputWithNetmaskComponent,
      FcMpioInfoBannerComponent,
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
      mockProvider(SlideIn),
      mockProvider(DialogService),
      mockProvider(FibreChannelService, {
        loadTargetPorts: jest.fn(() => of([])),
        linkFiberChannelPortsToTarget: jest.fn(() => of(null)),
        validatePhysicalPortUniqueness: jest.fn(() => ({ valid: true, duplicates: [] as string[] })),
      }),
      mockProvider(SlideInRef, slideInRef),
      mockApi([
        mockCall('tn_connect.config'),
        mockCall('fc.fc_host.query', []),
        mockCall('fcport.port_choices', {}),
        mockCall('iscsi.target.create'),
        mockCall('iscsi.target.update', { id: 123 } as IscsiTarget),
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
      // Click Add buttons to create FormArray items:
      // addButtons[0] = Add button for groups (click twice for 2 groups)
      // addButtons[1] = Add button for auth_networks (click twice for 2 networks)
      const addButtons = await loader.getAllHarnesses(MatButtonHarness.with({ text: 'Add' }));
      await addButtons[0].click();
      await addButtons[0].click();
      await addButtons[1].click();
      await addButtons[1].click();

      // Use patchValue to set nested FormArray values (simpler than harness for complex nested structures)
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
          mockProvider(SlideInRef, { ...slideInRef, getData: () => existingTarget }),
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
            groups: [], // Groups are cleared when mode is FC
            auth_networks: ['192.168.10.0/24', '192.168.0.0/24'],
          },
        ],
      );
      expect(spectator.inject(FibreChannelService).linkFiberChannelPortsToTarget).toHaveBeenCalledWith(
        123,
        [],
      );
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });

    it('loads and shows the \'portal\', \'initiator\' and \'auth\'', () => {
      let portal;
      let initiator;
      let auth: Option[] = [];

      spectator.component.portals$.subscribe((options) => portal = options);
      spectator.component.initiators$.subscribe((options) => initiator = options);
      spectator.component.auths$.subscribe((options) => auth = options);

      expect(api.call).toHaveBeenNthCalledWith(1, 'tn_connect.config');
      expect(api.call).toHaveBeenNthCalledWith(2, 'fc.capable');
      expect(api.call).toHaveBeenNthCalledWith(3, 'iscsi.portal.query', []);
      expect(api.call).toHaveBeenNthCalledWith(4, 'iscsi.initiator.query', []);
      expect(api.call).toHaveBeenNthCalledWith(5, 'iscsi.auth.query', []);

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
      api = spectator.inject(ApiService);
      jest.spyOn(api, 'call').mockImplementation((method) => {
        if (method === 'iscsi.target.validate_name') {
          return of('Target with this name already exists');
        }
        return of(null);
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

  describe('MPIO info banner conditional display', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('should not display banner when there are 0 FC ports', async () => {
      await form.fillForm({
        Mode: 'Fibre Channel',
      });
      spectator.detectChanges();

      const banner = spectator.query('ix-fc-mpio-info-banner');
      expect(banner).not.toExist();
    });
  });

  describe('groups visibility based on mode', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows groups section when mode is iSCSI', async () => {
      await form.fillForm({
        Mode: 'iSCSI',
      });

      const groupsList = spectator.query('ix-list[formArrayName="groups"]');
      expect(groupsList).toExist();
    });

    it('shows groups section when mode is BOTH', async () => {
      await form.fillForm({
        Mode: 'Both',
      });

      const groupsList = spectator.query('ix-list[formArrayName="groups"]');
      expect(groupsList).toExist();
    });

    it('hides groups section when mode is FC', async () => {
      await form.fillForm({
        Mode: 'Fibre Channel',
      });

      const groupsList = spectator.query('ix-list[formArrayName="groups"]');
      expect(groupsList).not.toExist();
    });
  });

  describe('groups in API calls based on mode', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => existingTarget }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
    });

    it('sends empty groups array when submitting with FC mode', async () => {
      await form.fillForm({
        Mode: 'Fibre Channel',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenLastCalledWith(
        'iscsi.target.update',
        [
          123,
          expect.objectContaining({
            mode: IscsiTargetMode.Fc,
            groups: [],
          }),
        ],
      );
    });

    it('sends groups array when submitting with iSCSI mode', async () => {
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenLastCalledWith(
        'iscsi.target.update',
        [
          123,
          expect.objectContaining({
            mode: IscsiTargetMode.Iscsi,
            groups: existingTarget.groups,
          }),
        ],
      );
    });

    it('sends groups array when submitting with BOTH mode', async () => {
      await form.fillForm({
        Mode: 'Both',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenLastCalledWith(
        'iscsi.target.update',
        [
          123,
          expect.objectContaining({
            mode: IscsiTargetMode.Both,
            groups: existingTarget.groups,
          }),
        ],
      );
    });
  });

  describe('mode switching UX preserves groups in memory', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);
    });

    it('preserves groups when switching from iSCSI to FC and back to iSCSI', async () => {
      // Start with iSCSI mode and add a group
      await form.fillForm({
        'Target Name': 'test-target',
        Mode: 'iSCSI',
      });

      const groupsList = await loader.getHarness(IxListHarness.with({ label: 'Add groups' }));
      await groupsList.pressAddButton();

      // Fill in the group details
      await form.fillForm({
        'Portal Group ID': '1 (comment_1)',
        'Initiator Group ID': '3 (initiator_1)',
        'Authentication Method': 'Mutual CHAP',
        'Authentication Group Number': '55',
      });

      // Verify groups section is visible
      let groupsSection = spectator.query('ix-list[formArrayName="groups"]');
      expect(groupsSection).toExist();

      // Get the form values to verify groups are populated
      let groupsValues = await groupsList.getFormValues();
      expect(groupsValues).toHaveLength(1);
      expect(groupsValues[0]).toEqual({
        'Portal Group ID': '1 (comment_1)',
        'Initiator Group ID': '3 (initiator_1)',
        'Authentication Method': 'Mutual CHAP',
        'Authentication Group Number': '55',
      });

      // Switch to FC mode - groups should be hidden but preserved
      await form.fillForm({
        Mode: 'Fibre Channel',
      });

      groupsSection = spectator.query('ix-list[formArrayName="groups"]');
      expect(groupsSection).not.toExist();

      // Switch back to iSCSI mode - groups should reappear with same values
      await form.fillForm({
        Mode: 'iSCSI',
      });

      groupsSection = spectator.query('ix-list[formArrayName="groups"]');
      expect(groupsSection).toExist();

      // Verify the groups still have the same values
      groupsValues = await groupsList.getFormValues();
      expect(groupsValues).toHaveLength(1);
      expect(groupsValues[0]).toEqual({
        'Portal Group ID': '1 (comment_1)',
        'Initiator Group ID': '3 (initiator_1)',
        'Authentication Method': 'Mutual CHAP',
        'Authentication Group Number': '55',
      });
    });

    it('submits correct API payload after mode switching: iSCSI with groups → FC (no groups) → iSCSI with groups', async () => {
      // Start with iSCSI mode and add a group
      await form.fillForm({
        'Target Name': 'test-target',
        Mode: 'iSCSI',
      });

      const groupsList = await loader.getHarness(IxListHarness.with({ label: 'Add groups' }));
      await groupsList.pressAddButton();

      await form.fillForm({
        'Portal Group ID': '1 (comment_1)',
        'Initiator Group ID': '3 (initiator_1)',
        'Authentication Method': 'Mutual CHAP',
        'Authentication Group Number': '55',
      });

      // Switch to FC mode and submit - should send empty groups array
      await form.fillForm({
        Mode: 'Fibre Channel',
      });

      let saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenLastCalledWith(
        'iscsi.target.create',
        [expect.objectContaining({
          mode: IscsiTargetMode.Fc,
          groups: [],
        })],
      );

      // Reset form for next submission
      jest.clearAllMocks();
      spectator.component.form.markAsPristine();

      // Switch back to iSCSI and submit - should send groups array
      await form.fillForm({
        Mode: 'iSCSI',
      });

      saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenLastCalledWith(
        'iscsi.target.create',
        [expect.objectContaining({
          mode: IscsiTargetMode.Iscsi,
          groups: [{
            portal: 1,
            initiator: 3,
            authmethod: IscsiAuthMethod.ChapMutual,
            auth: 55,
          }],
        })],
      );
    });

    it('preserves groups when switching from BOTH to FC and back to BOTH', async () => {
      await form.fillForm({
        'Target Name': 'test-target',
        Mode: 'Both',
      });

      const groupsList = await loader.getHarness(IxListHarness.with({ label: 'Add groups' }));
      await groupsList.pressAddButton();

      await form.fillForm({
        'Portal Group ID': '2 (comment_2)',
        'Initiator Group ID': '4 (initiator_2)',
        'Authentication Method': 'CHAP',
      });

      // Switch to FC mode
      await form.fillForm({
        Mode: 'Fibre Channel',
      });

      let groupsSection = spectator.query('ix-list[formArrayName="groups"]');
      expect(groupsSection).not.toExist();

      // Switch back to BOTH mode
      await form.fillForm({
        Mode: 'Both',
      });

      groupsSection = spectator.query('ix-list[formArrayName="groups"]');
      expect(groupsSection).toExist();

      // Verify groups are preserved
      const groupsValues = await groupsList.getFormValues();
      expect(groupsValues).toHaveLength(1);
      expect(groupsValues[0]).toMatchObject({
        'Portal Group ID': '2 (comment_2)',
        'Initiator Group ID': '4 (initiator_2)',
        'Authentication Method': 'CHAP',
      });
    });
  });
});
