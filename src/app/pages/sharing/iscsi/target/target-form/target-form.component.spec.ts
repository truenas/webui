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
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
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

      expect(api.call).toHaveBeenNthCalledWith(1, 'fc.capable');
      expect(api.call).toHaveBeenNthCalledWith(2, 'tn_connect.config');
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

  describe('FC port filtering with multiple ports', () => {
    const mockFcHosts = [
      {
        id: 1, alias: 'fc0', npiv: 2, wwpn: '10:00:00:00:c9:20:00:00', wwpn_b: '10:00:00:00:c9:20:00:01',
      },
      {
        id: 2, alias: 'fc1', npiv: 0, wwpn: '10:00:00:00:c9:30:00:00', wwpn_b: '10:00:00:00:c9:30:00:01',
      },
      {
        id: 3, alias: 'fc2', npiv: 1, wwpn: '10:00:00:00:c9:40:00:00', wwpn_b: '10:00:00:00:c9:40:00:01',
      },
    ];

    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, slideInRef),
          mockApi([
            mockCall('fc.fc_host.query', mockFcHosts),
            mockCall('fcport.port_choices', {
              fc0: { wwpn: '10:00:00:00:c9:20:00:00', wwpn_b: '10:00:00:00:c9:20:00:01' },
              'fc0/1': { wwpn: '10:00:00:00:c9:20:01:00', wwpn_b: '10:00:00:00:c9:20:01:01' },
              'fc0/2': { wwpn: '10:00:00:00:c9:20:02:00', wwpn_b: '10:00:00:00:c9:20:02:01' },
              fc1: { wwpn: '10:00:00:00:c9:30:00:00', wwpn_b: '10:00:00:00:c9:30:00:01' },
              fc2: { wwpn: '10:00:00:00:c9:40:00:00', wwpn_b: '10:00:00:00:c9:40:00:01' },
              'fc2/1': { wwpn: '10:00:00:00:c9:40:01:00', wwpn_b: '10:00:00:00:c9:40:01:01' },
              fc3: { wwpn: '10:00:00:00:c9:50:00:00', wwpn_b: '10:00:00:00:c9:50:00:01' },
              fc4: { wwpn: '10:00:00:00:c9:60:00:00', wwpn_b: '10:00:00:00:c9:60:00:01' },
            }),
            mockCall('iscsi.target.create', { id: 1 } as IscsiTarget),
            mockCall('iscsi.target.validate_name', null),
            mockCall('fc.capable', true),
            mockCall('iscsi.portal.query', []),
            mockCall('iscsi.initiator.query', []),
            mockCall('iscsi.auth.query', []),
          ]),
          mockProvider(FibreChannelService, {
            linkFiberChannelPortsToTarget: jest.fn(() => of(null)),
            validatePhysicalPortUniqueness: jest.fn(() => ({ valid: true, duplicates: [] as string[] })),
            getPhysicalPort: jest.fn((portForm) => {
              if (portForm.port) {
                return portForm.port.split('/')[0];
              }
              return null;
            }),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);

      // Wait for ngOnInit API calls to complete
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Manually populate signals since API mocks aren't completing
      // (This is a workaround - the API calls are made but observables aren't emitting)
      spectator.component.availableFcPorts.set([
        'fc0', 'fc0/1', 'fc0/2', 'fc1', 'fc2', 'fc2/1', 'fc3', 'fc4',
      ]);
      spectator.component.fcHosts.set(mockFcHosts.map((host) => ({ id: host.id, alias: host.alias })));

      // Set mode to FC to show port controls
      await form.fillForm({
        Mode: 'Fibre Channel',
      });

      spectator.detectChanges();
      await spectator.fixture.whenStable();
    });

    it('filters out ports with same physical port when selecting in second dropdown', async () => {
      // User clicks "Add" button for Fibre Channel Ports twice
      const fcPortAddButton = await loader.getHarness(MatButtonHarness.with({
        text: 'Add',
        ancestor: 'ix-list[formarrayname="fcPorts"]',
      }));

      await fcPortAddButton.click();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      await fcPortAddButton.click();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Get both "Existing Port" dropdowns
      const portSelects = await loader.getAllHarnesses(IxSelectHarness.with({ label: 'Existing Port' }));
      expect(portSelects).toHaveLength(2);

      // User selects fc0 in first dropdown
      await portSelects[0].setValue('fc0');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify user sees second dropdown does NOT show fc0 or fc0/* (same physical port)
      const secondDropdownOptions = await portSelects[1].getOptionLabels();
      expect(secondDropdownOptions).not.toContain('fc0');
      expect(secondDropdownOptions).not.toContain('fc0/1');
      expect(secondDropdownOptions).not.toContain('fc0/2');

      // Verify user sees second dropdown DOES show other physical ports
      expect(secondDropdownOptions).toContain('fc1');
      expect(secondDropdownOptions).toContain('fc2');
      expect(secondDropdownOptions).toContain('fc2/1');
      expect(secondDropdownOptions).toContain('fc3');
    });

    it('updates dropdown options reactively when selection in another dropdown changes', async () => {
      // User adds two ports
      const fcPortAddButton = await loader.getHarness(MatButtonHarness.with({
        text: 'Add',
        ancestor: 'ix-list[formarrayname="fcPorts"]',
      }));

      await fcPortAddButton.click();
      await fcPortAddButton.click();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const portSelects = await loader.getAllHarnesses(IxSelectHarness.with({ label: 'Existing Port' }));

      // User selects fc0 in first dropdown
      await portSelects[0].setValue('fc0');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify user sees second dropdown excludes fc0
      let secondOptions = await portSelects[1].getOptionLabels();
      expect(secondOptions).not.toContain('fc0');
      expect(secondOptions).toContain('fc2');

      // User changes first dropdown from fc0 to fc2
      await portSelects[0].setValue('fc2');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify user sees second dropdown now excludes fc2 but shows fc0
      secondOptions = await portSelects[1].getOptionLabels();
      expect(secondOptions).toContain('fc0');
      expect(secondOptions).not.toContain('fc2');
      expect(secondOptions).not.toContain('fc2/1');
    });

    it('updates dropdown options when user removes a port', async () => {
      // User adds three ports
      const fcPortAddButton = await loader.getHarness(MatButtonHarness.with({
        text: 'Add',
        ancestor: 'ix-list[formarrayname="fcPorts"]',
      }));

      await fcPortAddButton.click();
      await fcPortAddButton.click();
      await fcPortAddButton.click();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      const portSelects = await loader.getAllHarnesses(IxSelectHarness.with({ label: 'Existing Port' }));

      // User selects ports: A=fc0, B=fc2
      await portSelects[0].setValue('fc0');
      await portSelects[1].setValue('fc2');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Verify third dropdown excludes both fc0 and fc2
      const thirdOptions = await portSelects[2].getOptionLabels();
      expect(thirdOptions).not.toContain('fc0');
      expect(thirdOptions).not.toContain('fc2');
      expect(thirdOptions).toContain('fc1');
      expect(thirdOptions).toContain('fc3');

      // User clicks delete button on second port (fc2)
      const fcPortDeleteButtons = await loader.getAllHarnesses(MatButtonHarness.with({
        selector: 'button[aria-label="Remove Port item"]',
      }));
      await fcPortDeleteButtons[1].click();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Now there are only 2 ports, and user sees second dropdown now includes fc2
      const updatedPortSelects = await loader.getAllHarnesses(IxSelectHarness.with({ label: 'Existing Port' }));
      expect(updatedPortSelects).toHaveLength(2);

      const secondPortOptions = await updatedPortSelects[1].getOptionLabels();
      expect(secondPortOptions).not.toContain('fc0'); // Still excludes fc0
      expect(secondPortOptions).toContain('fc2'); // Now includes fc2
    });

    it('shows newly available options when user adds another port', async () => {
      // User adds two ports and selects values
      const fcPortAddButton = await loader.getHarness(MatButtonHarness.with({
        text: 'Add',
        ancestor: 'ix-list[formarrayname="fcPorts"]',
      }));

      await fcPortAddButton.click();
      await fcPortAddButton.click();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      let portSelects = await loader.getAllHarnesses(IxSelectHarness.with({ label: 'Existing Port' }));
      await portSelects[0].setValue('fc0');
      await portSelects[1].setValue('fc2');
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // User adds a third port
      await fcPortAddButton.click();
      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // User sees third dropdown excludes both fc0 and fc2
      portSelects = await loader.getAllHarnesses(IxSelectHarness.with({ label: 'Existing Port' }));
      const thirdOptions = await portSelects[2].getOptionLabels();
      expect(thirdOptions).not.toContain('fc0');
      expect(thirdOptions).not.toContain('fc2');
      expect(thirdOptions).toContain('fc1');
      expect(thirdOptions).toContain('fc3');
    });
  });

  describe('editing existing target with FC ports', () => {
    const mockFcHosts = [
      {
        id: 1, alias: 'fc0', npiv: 2, wwpn: '10:00:00:00:c9:20:00:00', wwpn_b: '10:00:00:00:c9:20:00:01',
      },
      {
        id: 2, alias: 'fc2', npiv: 1, wwpn: '10:00:00:00:c9:40:00:00', wwpn_b: '10:00:00:00:c9:40:00:01',
      },
    ];

    const mockExistingPorts = [
      {
        id: 1,
        port: 'fc0',
        wwpn: '10:00:00:00:c9:20:00:00',
        wwpn_b: '10:00:00:00:c9:20:00:01',
        target: {
          id: 123,
          iscsi_target_name: 'fc_target',
          iscsi_target_alias: null as string | null,
          iscsi_target_mode: 'FC',
          iscsi_target_auth_networks: [] as string[],
          iscsi_target_rel_tgt_id: 1,
        },
      },
      {
        id: 2,
        port: 'fc2/1',
        wwpn: '10:00:00:00:c9:40:01:00',
        wwpn_b: '10:00:00:00:c9:40:01:01',
        target: {
          id: 123,
          iscsi_target_name: 'fc_target',
          iscsi_target_alias: null as string | null,
          iscsi_target_mode: 'FC',
          iscsi_target_auth_networks: [] as string[],
          iscsi_target_rel_tgt_id: 1,
        },
      },
    ];

    const existingFcTarget = {
      id: 123,
      name: 'fc_target',
      alias: 'fc_alias',
      mode: IscsiTargetMode.Fc,
      groups: [],
      auth_networks: [],
    } as IscsiTarget;

    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => existingFcTarget }),
          mockApi([
            mockCall('fc.fc_host.query', mockFcHosts),
            mockCall('fcport.port_choices', {
              fc0: { wwpn: '10:00:00:00:c9:20:00:00', wwpn_b: '10:00:00:00:c9:20:00:01' },
              fc1: { wwpn: '10:00:00:00:c9:30:00:00', wwpn_b: '10:00:00:00:c9:30:00:01' },
              'fc2/1': { wwpn: '10:00:00:00:c9:40:01:00', wwpn_b: '10:00:00:00:c9:40:01:01' },
              fc3: { wwpn: '10:00:00:00:c9:50:00:00', wwpn_b: '10:00:00:00:c9:50:00:01' },
            }),
            mockCall('fcport.query', mockExistingPorts),
            mockCall('iscsi.target.update', { id: 123 } as IscsiTarget),
            mockCall('iscsi.target.validate_name', null),
            mockCall('fc.capable', true),
            mockCall('iscsi.portal.query', []),
            mockCall('iscsi.initiator.query', []),
            mockCall('iscsi.auth.query', []),
          ]),
          mockProvider(FibreChannelService, {
            loadTargetPorts: jest.fn(() => of(mockExistingPorts)),
            linkFiberChannelPortsToTarget: jest.fn(() => of(null)),
            validatePhysicalPortUniqueness: jest.fn(() => ({ valid: true, duplicates: [] as string[] })),
            getPhysicalPort: jest.fn((portForm) => {
              if (portForm.port) {
                return portForm.port.split('/')[0];
              }
              return null;
            }),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
      api = spectator.inject(ApiService);

      spectator.detectChanges();
      await spectator.fixture.whenStable();

      // Manually populate signals since API mocks aren't completing
      spectator.component.availableFcPorts.set(['fc0', 'fc1', 'fc2/1', 'fc3']);
      spectator.component.fcHosts.set(mockFcHosts.map((host) => ({ id: host.id, alias: host.alias })));

      spectator.detectChanges();
      await spectator.fixture.whenStable();
    });

    it('displays existing port configurations in dropdowns', async () => {
      // User sees two port rows with dropdowns
      const portSelects = await loader.getAllHarnesses(IxSelectHarness.with({ label: 'Existing Port' }));
      expect(portSelects).toHaveLength(2);

      // User sees first dropdown shows fc0 as selected
      const firstPortValue = await portSelects[0].getValue();
      expect(firstPortValue).toBe('fc0');

      // User sees second dropdown shows fc2/1 as selected
      const secondPortValue = await portSelects[1].getValue();
      expect(secondPortValue).toBe('fc2/1');
    });

    it('shows correct filtered options in each dropdown', async () => {
      // User sees two port dropdowns
      const portSelects = await loader.getAllHarnesses(IxSelectHarness.with({ label: 'Existing Port' }));

      // First dropdown (fc0 selected) shows fc0 and excludes fc2/fc2/1 (used by second port)
      const firstPortOptions = await portSelects[0].getOptionLabels();
      expect(firstPortOptions).toContain('fc0'); // Current selection always shown
      expect(firstPortOptions).toContain('fc1'); // Available port
      expect(firstPortOptions).not.toContain('fc2/1'); // Used by second port (fc2/1 has physical port fc2)

      // Second dropdown (fc2/1 selected) shows fc2/1 and excludes fc0 (used by first port)
      const secondPortOptions = await portSelects[1].getOptionLabels();
      expect(secondPortOptions).toContain('fc2/1'); // Current selection always shown
      expect(secondPortOptions).toContain('fc1'); // Available port
      expect(secondPortOptions).not.toContain('fc0'); // Used by first port
    });

    it('loads FC ports from API on edit', () => {
      expect(spectator.inject(FibreChannelService).loadTargetPorts).toHaveBeenCalledWith(123);
    });
  });
});
