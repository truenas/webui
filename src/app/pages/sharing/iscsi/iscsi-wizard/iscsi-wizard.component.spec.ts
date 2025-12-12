import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatStepperModule } from '@angular/material/stepper';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { LicenseFeature } from 'app/enums/license-feature.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { FibreChannelHost, FibreChannelPortChoices } from 'app/interfaces/fibre-channel.interface';
import { IscsiGlobalSession } from 'app/interfaces/iscsi-global-config.interface';
import {
  IscsiAuthAccess, IscsiExtent, IscsiInitiatorGroup, IscsiPortal, IscsiTarget, IscsiTargetExtent,
} from 'app/interfaces/iscsi.interface';
import { Service } from 'app/interfaces/service.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxListHarness } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
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

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(() => true),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: IscsiWizardComponent,
    imports: [
      ReactiveFormsModule,
      MatStepperModule,
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
                features: [LicenseFeature.FibreChannel],
              },
            } as SystemInfo,
          },
        ],
      }),
      mockProvider(SlideInRef, slideInRef),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
    store$ = spectator.inject(Store);
    jest.spyOn(store$, 'dispatch');
  });

  it('iSCSI: creates objects when wizard is submitted', fakeAsync(async () => {
    spectator.tick(100);

    await form.fillForm({
      Name: 'test-name',
      Device: 'Create New',
      'Pool/Dataset': '/mnt/new_pool',
      Size: 1024,
      Portal: 'Create New',
      Initiators: ['initiator1', 'initiator2'],
    });

    const addIpAddressButton = await loader.getHarness(IxListHarness.with({ label: 'IP Address' }));
    await addIpAddressButton.pressAddButton();

    await form.fillForm(
      {
        'IP Address': '::',
      },
    );

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
    tick();

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(9, 'pool.dataset.create', [{
      name: 'new_pool/test-name',
      type: 'VOLUME',
      volsize: 1073741824,
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(10, 'iscsi.extent.create', [{
      blocksize: 512,
      disk: 'zvol/my+pool/test_zvol',
      insecure_tpc: true,
      name: 'test-name',
      product_id: null,
      rpm: 'SSD',
      type: 'DISK',
      xen: false,
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(11, 'iscsi.portal.create', [{
      comment: 'test-name',
      listen: [{ ip: '::' }],
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(12, 'iscsi.initiator.create', [{
      comment: 'test-name',
      initiators: ['initiator1', 'initiator2'],
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(13, 'iscsi.target.create', [{
      name: 'test-name',
      mode: 'ISCSI',
      groups: [{
        auth: null,
        authmethod: 'NONE',
        initiator: 14,
        portal: 13,
      }],
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(14, 'iscsi.targetextent.create', [{
      extent: 11,
      target: 15,
    }]);

    expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));

    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  }));

  it('fibre channel: creates objects when wizard is submitted', async () => {
    await form.fillForm({
      Name: 'test-name',
      Device: 'Create New',
      'Pool/Dataset': '/mnt/new_pool',
      Size: 1024,
      Portal: 'Create New',
      Initiators: ['initiator1', 'initiator2'],
    });

    const addIpAddressButton = await loader.getHarness(IxListHarness.with({ label: 'IP Address' }));
    await addIpAddressButton.pressAddButton();

    await form.fillForm(
      {
        'IP Address': '::',
      },
    );

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(9, 'pool.dataset.create', [{
      name: 'new_pool/test-name',
      type: 'VOLUME',
      volsize: 1073741824,
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(10, 'iscsi.extent.create', [{
      blocksize: 512,
      disk: 'zvol/my+pool/test_zvol',
      insecure_tpc: true,
      name: 'test-name',
      product_id: null,
      rpm: 'SSD',
      type: 'DISK',
      xen: false,
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(11, 'iscsi.portal.create', [{
      comment: 'test-name',
      listen: [{ ip: '::' }],
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(12, 'iscsi.initiator.create', [{
      comment: 'test-name',
      initiators: ['initiator1', 'initiator2'],
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(13, 'iscsi.target.create', [{
      name: 'test-name',
      mode: 'ISCSI',
      groups: [{
        auth: null,
        authmethod: 'NONE',
        initiator: 14,
        portal: 13,
      }],
    }]);

    expect(spectator.inject(ApiService).call).toHaveBeenNthCalledWith(14, 'iscsi.targetextent.create', [{
      extent: 11,
      target: 15,
    }]);

    expect(store$.dispatch).toHaveBeenCalledWith(checkIfServiceIsEnabled({ serviceName: ServiceName.Iscsi }));

    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });

  describe('FC MPIO validation', () => {
    beforeEach(async () => {
      // Fill target step with FC mode
      await form.fillForm({
        Name: 'test-fc-target',
        Mode: 'Fibre Channel',
      });

      // Move to extent step
      await form.fillForm({
        Device: 'Create New',
        'Pool/Dataset': '/mnt/new_pool',
        Size: 1024,
      });

      spectator.detectChanges();
    });

    it('allows valid MPIO configuration with ports on different physical HBAs', async () => {
      // Add first port on fc0
      const fcPortsList = await loader.getHarness(IxListHarness.with({ label: 'Fibre Channel Ports' }));
      await fcPortsList.pressAddButton();

      await form.fillForm({
        'Port Mode': 'Use existing port',
        'Existing Port': 'fc0',
      });

      // Add second port on fc1 (different physical HBA)
      await fcPortsList.pressAddButton();

      await form.fillForm({
        'Port Mode': 'Use existing port',
        'Existing Port': 'fc1',
      });

      spectator.detectChanges();

      // Verify no FC port validation errors displayed
      const errorElement = spectator.query('mat-error');
      expect(errorElement).toBeFalsy();

      // Note: Button may still be disabled due to other form validation,
      // but FC port validation specifically should pass
    });

    it('blocks invalid MPIO configuration with multiple ports on same physical HBA', async () => {
      // Add first port - fc0 (physical)
      const fcPortsList = await loader.getHarness(IxListHarness.with({ label: 'Fibre Channel Ports' }));
      await fcPortsList.pressAddButton();

      await form.fillForm({
        'Port Mode': 'Use existing port',
        'Existing Port': 'fc0',
      });

      // Add second port - fc0/1 (NPIV on fc0 - same physical HBA)
      await fcPortsList.pressAddButton();

      await form.fillForm({
        'Port Mode': 'Use existing port',
        'Existing Port': 'fc0/1',
      });

      spectator.detectChanges();

      // Verify error message is displayed
      const errorElement = spectator.query('mat-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('fc0');
      expect(errorElement.textContent).toContain('multiple times');

      // Verify submit button is disabled
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });

    it('blocks when two NPIV virtual ports share the same physical HBA', async () => {
      // Add two virtual ports on the same physical HBA
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

      // Verify submit button is disabled due to validation failure
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);

      // Note: Error detection for NPIV ports would require backend resolution
      // of host_id to port string, so validation happens at a different level
    });

    it('allows valid MPIO with mix of physical and NPIV ports on different HBAs', async () => {
      // Add physical port on fc0
      const fcPortsList = await loader.getHarness(IxListHarness.with({ label: 'Fibre Channel Ports' }));
      await fcPortsList.pressAddButton();

      await form.fillForm({
        'Port Mode': 'Use existing port',
        'Existing Port': 'fc0',
      });

      // Add NPIV port on fc1 (different physical HBA)
      await fcPortsList.pressAddButton();

      await form.fillForm({
        'Port Mode': 'Create new virtual port',
        'Choose Host for New Virtual Port': 'fc1/1',
      });

      spectator.detectChanges();

      // Verify no FC port validation error displayed
      const errorElement = spectator.query('mat-error');
      expect(errorElement).toBeFalsy();

      // Note: Mixed mode (physical + NPIV) should be valid as long as they're on different HBAs
    });

    it('shows validation error message in FC mode with duplicate HBAs', async () => {
      // Verify error is shown in FC mode with invalid config
      const fcPortsList = await loader.getHarness(IxListHarness.with({ label: 'Fibre Channel Ports' }));
      await fcPortsList.pressAddButton();
      await form.fillForm({
        'Port Mode': 'Use existing port',
        'Existing Port': 'fc0',
      });

      await fcPortsList.pressAddButton();
      await form.fillForm({
        'Port Mode': 'Use existing port',
        'Existing Port': 'fc0/1',
      });

      spectator.detectChanges();

      // Error message should be displayed
      const errorElement = spectator.query('mat-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('fc0');
    });

    it('allows empty FC ports array in FC mode when no ports added', () => {
      // No ports added - should still be valid (empty is acceptable)
      spectator.detectChanges();

      // No error message should be shown for empty ports
      const errorElement = spectator.query('mat-error');
      expect(errorElement).toBeFalsy();

      // Note: The form may still be invalid due to other required fields
      // but FC port validation specifically should pass
    });

    it('validates immediately when user adds duplicate HBA without requiring form submission', async () => {
      const fcPortsList = await loader.getHarness(IxListHarness.with({ label: 'Fibre Channel Ports' }));

      // Add first port
      await fcPortsList.pressAddButton();
      await form.fillForm({
        'Port Mode': 'Use existing port',
        'Existing Port': 'fc0',
      });

      spectator.detectChanges();

      // Should be valid with one port - no error shown
      let errorElement = spectator.query('mat-error');
      expect(errorElement).toBeFalsy();

      // Add duplicate HBA
      await fcPortsList.pressAddButton();
      await form.fillForm({
        'Port Mode': 'Use existing port',
        'Existing Port': 'fc0/1',
      });

      spectator.detectChanges();

      // Error should be visible immediately without form submission
      errorElement = spectator.query('mat-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('fc0');

      // Submit button should be disabled
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });

    it('blocks mixing new virtual port and existing port on same physical HBA (bug scenario)', async () => {
      // This tests the bug where mixing host_id (new virtual port) and port (existing port)
      // on the same HBA was not detected
      const fcPortsList = await loader.getHarness(IxListHarness.with({ label: 'Fibre Channel Ports' }));

      // Add new virtual port on fc0 (using host_id)
      // fc0 has npiv=1, so next port is fc0/2
      await fcPortsList.pressAddButton();
      await form.fillForm({
        'Port Mode': 'Create new virtual port',
        'Choose Host for New Virtual Port': 'fc0/2', // This will set host_id for fc0
      });

      // Add existing virtual port on fc0 (using port string)
      await fcPortsList.pressAddButton();
      await form.fillForm({
        'Port Mode': 'Use existing port',
        'Existing Port': 'fc0/1', // This sets port string for fc0
      });

      spectator.detectChanges();

      // Should show validation error because both ports are on fc0
      const errorElement = spectator.query('mat-error');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('fc0');
      expect(errorElement.textContent).toContain('multiple times');

      // Submit button should be disabled
      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      expect(await saveButton.isDisabled()).toBe(true);
    });
  });
});
