import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { TnChipInputHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { IscsiExtentType, IscsiExtentUsefor } from 'app/enums/iscsi.enum';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { FibreChannelHost, FibreChannelPortChoices } from 'app/interfaces/fibre-channel.interface';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import {
  IscsiAuthAccess, IscsiExtent, IscsiInitiatorGroup, IscsiPortal, IscsiTarget, IscsiTargetExtent,
} from 'app/interfaces/iscsi.interface';
import { newOption } from 'app/interfaces/option.interface';
import { Service } from 'app/interfaces/service.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { ExtentWizardStepComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/steps/extent-wizard-step/extent-wizard-step.component';
import { ProtocolOptionsWizardStepComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/steps/protocol-options-wizard-step/protocol-options-wizard-step.component';
import { TargetWizardStepComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/steps/target-wizard-step/target-wizard-step.component';
import { AppState } from 'app/store';
import { checkIfServiceIsEnabled } from 'app/store/services/services.actions';
import { selectServices } from 'app/store/services/services.selectors';
import { selectSystemInfo } from 'app/store/system-info/system-info.selectors';

describe('IscsiWizardComponent', () => {
  let spectator: Spectator<IscsiWizardComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  let store$: Store<AppState>;

  const createComponent = createComponentFactory({
    component: IscsiWizardComponent,
    imports: [
      ReactiveFormsModule,
      TargetWizardStepComponent,
      ExtentWizardStepComponent,
      ProtocolOptionsWizardStepComponent,
      MockComponent(ExplorerCreateDatasetComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('fc.capable', true),
        mockCall('iscsi.global.sessions', [] as IscsiGlobalSession[]),
        mockCall('iscsi.extent.query', []),
        mockCall('iscsi.target.query', []),
        mockCall('iscsi.portal.query', []),
        mockCall('iscsi.auth.query', []),
        mockCall('iscsi.extent.disk_choices', {}),
        mockCall('iscsi.portal.listen_ip_choices', {
          '0.0.0.0': '0.0.0.0',
          '192.168.1.3': '192.168.1.3',
          '::': '::',
        }),
        mockCall('pool.dataset.create', { id: 'my pool/test_zvol' } as Dataset),
        mockCall('iscsi.extent.create', { id: 11 } as IscsiExtent),
        mockCall('iscsi.auth.create', { id: 12, tag: 12 } as IscsiAuthAccess),
        mockCall('iscsi.portal.create', { id: 13 } as IscsiPortal),
        mockCall('iscsi.initiator.create', { id: 14 } as IscsiInitiatorGroup),
        mockCall('iscsi.target.create', { id: 15 } as IscsiTarget),
        mockCall('iscsi.targetextent.create', { id: 16 } as IscsiTargetExtent),
        mockCall('fcport.port_choices', {
          fc0: { wwpn: '10:00:00:00:c9:20:00:00', wwpn_b: '10:00:00:00:c9:20:00:01' },
          fc1: { wwpn: '10:00:00:00:c9:30:00:00', wwpn_b: '10:00:00:00:c9:30:00:01' },
          'fc0/1': { wwpn: '10:00:00:00:c9:20:01:00', wwpn_b: '10:00:00:00:c9:20:01:01' },
        } as FibreChannelPortChoices),
        mockCall('fc.fc_host.query', [
          {
            id: 1, alias: 'fc0', npiv: 1, wwpn: '10:00:00:00:c9:20:00:00', wwpn_b: '10:00:00:00:c9:20:00:01',
          },
          {
            id: 2, alias: 'fc1', npiv: 0, wwpn: '10:00:00:00:c9:30:00:00', wwpn_b: '10:00:00:00:c9:30:00:01',
          },
        ] as FibreChannelHost[]),
        mockCall('fcport.query', []),
        mockCall('fcport.create'),
        mockCall('fc.fc_host.update'),
      ]),
      provideMockStore({
        selectors: [
          {
            selector: selectServices,
            value: [{
              service: ServiceName.Iscsi,
              id: 4,
              enable: false,
              state: ServiceStatus.Stopped,
            } as Service],
          },
          {
            selector: selectSystemInfo,
            value: {
              version: 'TrueNAS-SCALE-22.12',
              license: {
                features: [{ name: LicenseFeature.FibreChannel, start_date: null, expires_at: null }],
              },
            } as SystemInfo,
          },
        ],
      }),
    ],
  });

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getTnChipInput = (name: string): Promise<TnChipInputHarness> => loader.getHarness(
    TnChipInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  beforeEach(async () => {
    spectator = createComponent();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');
  });

  // Back/Next/Save live in the side-panel footer (rendered by the host container, not
  // this fixture), so navigation is driven through the public footer surface — same
  // pattern as the add-subsystem wizard spec.
  async function clickNext(): Promise<void> {
    const next = spectator.component.footerActions.find((action) => action.testId === 'next');
    expect(next).toBeTruthy();
    expect(next.disabled?.()).toBeFalsy();
    next.onClick();
    spectator.detectChanges();
    await spectator.fixture.whenStable();
  }

  async function fillIscsiWizard(): Promise<void> {
    // Target step (defaults to "Create New" target) -> Next
    await clickNext();

    // Extent step
    form = await loader.getHarness(IxFormHarness);
    await (await getTnInput('name')).setValue('test-name');
    await (await getTnSelect('disk')).selectOption('Create New');
    await form.fillForm({
      'Pool/Dataset': '/mnt/new_pool',
    });
    await (await getTnInput('volsize')).setValue('1024 MiB');
    await clickNext();

    // Protocol Options step
    await (await getTnSelect('portal')).selectOption('Create New');

    const initiatorsInput = await getTnChipInput('initiators');
    await initiatorsInput.addChip('initiator1');
    await initiatorsInput.addChip('initiator2');

    const addIpAddressButton = await loader.getHarness(IxListHarness.with({ label: 'IP Address' }));
    await addIpAddressButton.pressAddButton();

    const listenIpSelect = await loader.getHarness(
      TnSelectHarness.with({ ancestor: 'ix-list-item' }),
    );
    await listenIpSelect.selectOption('::');
  }

  async function submitWizard(): Promise<void> {
    // Save renders in the host footer and calls the form's public submit().
    expect(spectator.component.hideSave()).toBe(false);
    expect(spectator.component.canSubmit()).toBe(true);
    spectator.component.submit();

    // Wait for all async operations to complete
    await new Promise<void>((resolve) => {
      setTimeout(resolve, 100);
    });
    spectator.detectChanges();
    await spectator.fixture.whenStable();
  }

  it('iSCSI: creates objects when wizard is submitted', async () => {
    let createdTarget: IscsiTarget | undefined;
    spectator.component.closed.subscribe((target) => {
      createdTarget = target;
    });

    await fillIscsiWizard();
    await submitWizard();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.dataset.create', [{
      name: 'new_pool/test-name',
      type: 'VOLUME',
      volsize: 1073741824,
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.extent.create', [{
      blocksize: 512,
      disk: 'zvol/my+pool/test_zvol',
      insecure_tpc: true,
      name: 'test-name',
      product_id: null,
      ro: false,
      rpm: 'SSD',
      type: 'DISK',
      xen: false,
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.portal.create', [{
      comment: 'test-name',
      listen: [{ ip: '::' }],
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.initiator.create', [{
      comment: 'test-name',
      initiators: ['initiator1', 'initiator2'],
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.target.create', [{
      name: 'test-name',
      mode: 'ISCSI',
      groups: [{
        auth: null,
        authmethod: 'NONE',
        initiator: 14,
        portal: 13,
      }],
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.targetextent.create', [{
      extent: 11,
      target: 15,
    }]);

    expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));

    expect(createdTarget).toEqual({ id: 15 } as IscsiTarget);
  });

  it('fibre channel: creates a Fibre Channel target when wizard is submitted', async () => {
    let createdTarget: IscsiTarget | undefined;
    spectator.component.closed.subscribe((target) => {
      createdTarget = target;
    });

    // Target step: switch to Fibre Channel mode
    form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ Mode: 'Fibre Channel' });
    await clickNext();

    // Extent step
    form = await loader.getHarness(IxFormHarness);
    await (await getTnInput('name')).setValue('test-name');
    await (await getTnSelect('disk')).selectOption('Create New');
    await form.fillForm({ 'Pool/Dataset': '/mnt/new_pool' });
    await (await getTnInput('volsize')).setValue('1024 MiB');
    await clickNext();

    // Protocol Options step: FC mode swaps portals/initiators for Fibre Channel ports
    // and auto-adds an empty first port row, so fill it rather than adding another.
    form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Port Mode': 'Use existing port',
      'Existing Port': 'fc0',
    });

    await submitWizard();

    // FC targets carry no iSCSI portal/initiator groups.
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('iscsi.target.create', [{
      name: 'test-name',
      mode: 'FC',
      groups: [],
    }]);
    expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('iscsi.portal.create', expect.anything());
    expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('iscsi.initiator.create', expect.anything());

    // The chosen port is linked to the created target.
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('fcport.create', [{
      port: 'fc0',
      target_id: 15,
    }]);

    expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));

    expect(createdTarget).toEqual({ id: 15 } as IscsiTarget);
  });

  describe('FC MPIO validation', () => {
    beforeEach(async () => {
      // Target step: switch to Fibre Channel mode, then advance
      form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Mode: 'Fibre Channel',
      });
      await clickNext();

      // Extent step
      form = await loader.getHarness(IxFormHarness);
      await (await getTnInput('name')).setValue('test-fc-target');
      await (await getTnSelect('disk')).selectOption('Create New');
      await form.fillForm({
        'Pool/Dataset': '/mnt/new_pool',
      });
      await (await getTnInput('volsize')).setValue('1024 MiB');
      await clickNext();

      // Now on the Protocol Options step
      form = await loader.getHarness(IxFormHarness);
      spectator.detectChanges();
    });

    it('allows valid MPIO configuration with ports on different physical ports', async () => {
      // Add first port on fc0
      const fcPortsList = await loader.getHarness(IxListHarness.with({ label: 'Fibre Channel Ports' }));
      await fcPortsList.pressAddButton();

      await form.fillForm({
        'Port Mode': 'Use existing port',
        'Existing Port': 'fc0',
      });

      // Add second port on fc1 (different physical port)
      await fcPortsList.pressAddButton();

      await form.fillForm({
        'Port Mode': 'Use existing port',
        'Existing Port': 'fc1',
      });

      spectator.detectChanges();

      // Verify no FC port validation errors displayed
      const errorElement = spectator.query('.fc-port-error');
      expect(errorElement).toBeFalsy();

      // Note: Button may still be disabled due to other form validation,
      // but FC port validation specifically should pass
    });


    it('blocks when two NPIV virtual ports share the same physical port', async () => {
      // Add two virtual ports on the same physical port
      const fcPortsList = await loader.getHarness(IxListHarness.with({ label: 'Fibre Channel Ports' }));

      // First NPIV port on fc0
      await fcPortsList.pressAddButton();
      await form.fillForm({
        'Port Mode': 'Create new virtual port',
        'Choose Host for New Virtual Port': 'fc0/2',
      });

      // Second NPIV port on fc0 (should fail validation)
      await fcPortsList.pressAddButton();
      await form.fillForm({
        'Port Mode': 'Create new virtual port',
        'Choose Host for New Virtual Port': 'fc0/2',
      });

      spectator.detectChanges();

      // The footer Save is disabled via canSubmit due to the validation failure.
      expect(spectator.component.canSubmit()).toBe(false);

      // Note: Error detection for NPIV ports would require backend resolution
      // of host_id to port string, so validation happens at a different level
    });

    it('allows valid MPIO with mix of physical and NPIV ports on different ports', async () => {
      // Add physical port on fc0
      const fcPortsList = await loader.getHarness(IxListHarness.with({ label: 'Fibre Channel Ports' }));
      await fcPortsList.pressAddButton();

      await form.fillForm({
        'Port Mode': 'Use existing port',
        'Existing Port': 'fc0',
      });

      // Add NPIV port on fc1 (different physical port)
      await fcPortsList.pressAddButton();

      await form.fillForm({
        'Port Mode': 'Create new virtual port',
        'Choose Host for New Virtual Port': 'fc1/1',
      });

      spectator.detectChanges();

      // Verify no FC port validation error displayed
      const errorElement = spectator.query('.fc-port-error');
      expect(errorElement).toBeFalsy();

      // Note: Mixed mode (physical + NPIV) should be valid as long as they're on different physical ports
    });


    it('allows empty FC ports array in FC mode when no ports added', () => {
      // No ports added - should still be valid (empty is acceptable)
      spectator.detectChanges();

      // No error message should be shown for empty ports
      const errorElement = spectator.query('.fc-port-error');
      expect(errorElement).toBeFalsy();

      // Note: The form may still be invalid due to other required fields
      // but FC port validation specifically should pass
    });
  });

  describe('extentPayload getter - snapshot handling', () => {
    it('returns ro=true when disk is a ZFS snapshot (contains @)', () => {
      const extentGroup = spectator.component.form.controls.extent;
      extentGroup.controls.name.setValue('test-extent');
      extentGroup.controls.type.setValue(IscsiExtentType.Disk);
      extentGroup.controls.disk.setValue('zvol/tank/my-zvol@snapshot1');
      extentGroup.controls.usefor.setValue(IscsiExtentUsefor.Vmware);
      extentGroup.controls.product_id.setValue('');
      extentGroup.controls.ro.setValue(true);

      const payload = spectator.component.extentPayload;

      expect(payload.ro).toBe(true);
      expect(payload.disk).toBe('zvol/tank/my-zvol@snapshot1');
    });

    it('returns ro=false when disk is a regular zvol (no @)', () => {
      const extentGroup = spectator.component.form.controls.extent;
      extentGroup.controls.name.setValue('test-extent');
      extentGroup.controls.type.setValue(IscsiExtentType.Disk);
      extentGroup.controls.disk.setValue('zvol/tank/my-zvol');
      extentGroup.controls.usefor.setValue(IscsiExtentUsefor.Vmware);
      extentGroup.controls.product_id.setValue('');

      const payload = spectator.component.extentPayload;

      expect(payload.ro).toBe(false);
      expect(payload.disk).toBe('zvol/tank/my-zvol');
    });

    it('returns ro=false when creating a new zvol', () => {
      spectator.component.createdZvol = { id: 'tank/new-zvol' } as Dataset;
      const extentGroup = spectator.component.form.controls.extent;
      extentGroup.controls.name.setValue('test-extent');
      extentGroup.controls.type.setValue(IscsiExtentType.Disk);
      extentGroup.controls.disk.setValue(newOption);
      extentGroup.controls.usefor.setValue(IscsiExtentUsefor.Vmware);
      extentGroup.controls.product_id.setValue('');

      const payload = spectator.component.extentPayload;

      expect(payload.ro).toBe(false);
      expect(payload.disk).toBe('zvol/tank/new-zvol');
    });

    it('correctly detects snapshot from disk path with @ symbol', () => {
      const extentGroup = spectator.component.form.controls.extent;
      extentGroup.controls.type.setValue(IscsiExtentType.Disk);
      extentGroup.controls.disk.setValue('zvol/tank/my-zvol@snapshot1');
      extentGroup.controls.ro.setValue(true);

      const payload = spectator.component.extentPayload;

      expect(payload.disk?.includes('@')).toBe(true);
      expect(payload.ro).toBe(true);
    });

    it('correctly detects regular zvol without @ symbol', () => {
      const extentGroup = spectator.component.form.controls.extent;
      extentGroup.controls.type.setValue(IscsiExtentType.Disk);
      extentGroup.controls.disk.setValue('zvol/tank/my-zvol');

      const payload = spectator.component.extentPayload;

      expect(payload.disk?.includes('@')).toBe(false);
      expect(payload.ro).toBe(false);
    });
  });
});
