import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockStore, provideMockStore } from '@ngrx/store/testing';
import {
  TnCheckboxHarness, TnIconButtonHarness, TnInputHarness, TnRadioHarness, TnTooltipHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { MockAuthService } from 'app/core/testing/classes/mock-auth.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { EntitlementFeature } from 'app/enums/entitlement-feature.enum';
import { EntitlementReason } from 'app/enums/entitlement-reason.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { ServiceStatus } from 'app/enums/service-status.enum';
import { NvmeOfGlobalConfig } from 'app/interfaces/nvme-of.interface';
import { Service } from 'app/interfaces/service.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { ClipboardService } from 'app/services/clipboard.service';
import { selectEntitlements } from 'app/store/entitlements/entitlements.selectors';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectServices } from 'app/store/services/services.selectors';

describe('NvmeOfConfigurationComponent', () => {
  let spectator: Spectator<NvmeOfConfigurationComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: NvmeOfConfigurationComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('nvmet.global.update', null),
        mockCall('nvmet.global.config', {
          ana: true,
          rdma: true,
          kernel: true,
          xport_referral: false,
          basenqn: 'iqn.2005-10.org.freenas:ctl',
        } as NvmeOfGlobalConfig),
      ]),
      ...ixFormTestingProviders(),
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: true,
          },
          {
            // Loaded map with no gated keys, i.e. entitled to everything.
            selector: selectEntitlements,
            value: {},
          },
          {
            selector: selectServices,
            value: [{
              id: 1,
              service: ServiceName.NvmeOf,
              state: ServiceStatus.Stopped,
              enable: false,
              pids: [],
            } as Service],
          },
        ],
      }),
      mockProvider(NvmeOfService, {
        isRdmaCapable: jest.fn(() => of(true)),
      }),
      mockProvider(ClipboardService, {
        copy: jest.fn(() => Promise.resolve()),
      }),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads current global config when component is initialized', () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.config');
  });

  it('shows current values for global settings', async () => {
    const basenqn = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="basenqn"]' }));
    expect(await basenqn.getValue()).toBe('iqn.2005-10.org.freenas:ctl');

    const kernelRadio = await loader.getHarness(TnRadioHarness.with({ label: 'Linux Kernel' }));
    expect(await kernelRadio.isChecked()).toBe(true);

    const ana = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Enable Asymmetric Namespace Access (ANA)' }),
    );
    expect(await ana.isChecked()).toBe(true);

    const rdma = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Enable Remote Direct Memory Access (RDMA)' }),
    );
    expect(await rdma.isChecked()).toBe(true);
  });

  it('saves form values when the side panel host submits', async () => {
    const closedSpy = jest.fn();
    spectator.component.closed.subscribe(closedSpy);

    const basenqn = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="basenqn"]' }));
    await basenqn.setValue('new.2005-10.org.freenas:ctl');

    const spdkRadio = await loader.getHarness(TnRadioHarness.with({ label: 'SPDK (userspace)' }));
    await spdkRadio.check();

    expect(spectator.component.canSubmit()).toBe(true);
    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.update', [{
      ana: true,
      basenqn: 'new.2005-10.org.freenas:ctl',
      rdma: true,
      kernel: false,
    }]);
    expect(closedSpy).toHaveBeenCalledWith(true);
  });

  it('reports unsaved changes to the side panel close guard once the form is edited', async () => {
    expect(spectator.component.hasUnsavedChanges()).toBe(false);

    const basenqn = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="basenqn"]' }));
    await basenqn.setValue('new.2005-10.org.freenas:ctl');

    expect(spectator.component.hasUnsavedChanges()).toBe(true);
  });

  it('disables RDMA control if RDMA support is missing from the system', async () => {
    spectator.inject(NvmeOfService).isRdmaCapable.mockReturnValue(of(false));
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const rdma = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Enable Remote Direct Memory Access (RDMA)' }),
    );
    expect(await rdma.isDisabled()).toBe(true);
  });

  it('explains on hover that a disabled RDMA control needs an Enterprise license and RDMA hardware', async () => {
    spectator.inject(NvmeOfService).isRdmaCapable.mockReturnValue(of(false));
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    const rdma = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Enable Remote Direct Memory Access (RDMA)' }),
    );
    expect(await rdma.isDisabled()).toBe(true);

    // The `?` is swapped for a key icon carrying the same requirement text, which also shows on hover.
    const gate = spectator.query('[formControlName="rdma"]')!.closest('ix-licensed-feature')!;
    expect(gate.querySelector('tn-icon[name="key-variant"]')).toExist();
    // tn-tooltip opens on a setTimeout (showDelay, 0 by default), which whenStable() does not wait for.
    jest.useFakeTimers();
    spectator.dispatchMouseEvent(gate.querySelector('.control')!, 'mouseenter');
    jest.runOnlyPendingTimers();
    jest.useRealTimers();

    const tooltip = await TestbedHarnessEnvironment.documentRootLoader(spectator.fixture)
      .getHarness(TnTooltipHarness);
    expect(await tooltip.getText()).toContain('Enabling is limited to TrueNAS Enterprise-licensed systems');
  });

  it('disables ANA for systems without HA license', async () => {
    spectator.inject(MockStore).overrideSelector(selectIsHaLicensed, false);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const ana = await loader.getHarness(
      TnCheckboxHarness.with({ label: 'Enable Asymmetric Namespace Access (ANA)' }),
    );
    expect(await ana.isDisabled()).toBe(true);
  });

  it('disables Implementation field when NVMe service is running', async () => {
    spectator.inject(MockStore).overrideSelector(selectServices, [{
      id: 1,
      service: ServiceName.NvmeOf,
      state: ServiceStatus.Running,
      enable: true,
      pids: [1234],
    } as Service]);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const kernelRadio = await loader.getHarness(TnRadioHarness.with({ label: 'Linux Kernel' }));
    expect(await kernelRadio.isDisabled()).toBe(true);
  });

  it('hides the Implementation field when the system is not entitled to NVMEOF_SPDK', async () => {
    spectator.inject(MockStore).overrideSelector(selectEntitlements, {
      [EntitlementFeature.NvmeOfSpdk]: {
        entitled: false,
        reason: EntitlementReason.KeyMissing,
        message: 'SPDK is limited to enterprise licensed systems only.',
      },
    });
    spectator.inject(MockStore).refreshState();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    const radios = await loader.getAllHarnesses(TnRadioHarness);
    expect(radios).toHaveLength(0);
  });

  it('omits kernel from the payload when the system is not entitled to NVMEOF_SPDK', async () => {
    spectator.inject(MockStore).overrideSelector(selectEntitlements, {
      [EntitlementFeature.NvmeOfSpdk]: {
        entitled: false,
        reason: EntitlementReason.KeyMissing,
        message: 'SPDK is limited to enterprise licensed systems only.',
      },
    });
    spectator.inject(MockStore).refreshState();
    spectator.inject(NvmeOfService).isRdmaCapable.mockReturnValue(of(true));
    spectator = createComponent();
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    spectator.component.submit();
    await spectator.fixture.whenStable();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('nvmet.global.update', [{
      ana: true,
      basenqn: 'iqn.2005-10.org.freenas:ctl',
      rdma: true,
    }]);
  });

  it('copies the Base NQN to the clipboard', async () => {
    const copyButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'content-copy' }));
    await copyButton.click();

    expect(spectator.inject(ClipboardService).copy).toHaveBeenCalledWith('iqn.2005-10.org.freenas:ctl');
  });

  it('explains what ANA does in a help tooltip when the system is HA-licensed', () => {
    const gate = spectator.query('[formControlName="ana"]')!.closest('ix-licensed-feature')!;
    const help = gate.querySelector('button.icon-button')!;

    expect(gate.querySelector('tn-icon[name="help-circle"]')).toExist();
    expect(help.getAttribute('aria-label')).toContain('Asymmetric Namespace Access (ANA) reports which controller');
  });

  describe('user without the NVMe-oF write role', () => {
    beforeEach(async () => {
      spectator.inject(MockAuthService).hasRole.mockReturnValue(of(false));
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      await spectator.fixture.whenStable();
    });

    it('disables every control', async () => {
      const basenqn = await loader.getHarness(TnInputHarness.with({ selector: '[formControlName="basenqn"]' }));
      expect(await basenqn.isDisabled()).toBe(true);

      const radios = await loader.getAllHarnesses(TnRadioHarness);
      expect(radios).toHaveLength(2);
      for (const radio of radios) {
        expect(await radio.isDisabled()).toBe(true);
      }

      const checkboxes = await loader.getAllHarnesses(TnCheckboxHarness);
      expect(checkboxes).toHaveLength(2);
      for (const checkbox of checkboxes) {
        expect(await checkbox.isDisabled()).toBe(true);
      }
    });

    it('keeps the help icons instead of claiming a missing license or a running service', () => {
      expect(spectator.query('tn-icon[name="key-variant"]')).not.toExist();
      expect(spectator.queryAll('ix-licensed-feature tn-icon[name="help-circle"]')).toHaveLength(2);
    });

    it('shows the full Base NQN on hover', async () => {
      // tn-tooltip opens on a setTimeout (showDelay, 0 by default), which whenStable() does not wait for.
      jest.useFakeTimers();
      spectator.dispatchMouseEvent('tn-input[formControlName="basenqn"]', 'mouseenter');
      jest.runOnlyPendingTimers();
      jest.useRealTimers();

      const tooltip = await TestbedHarnessEnvironment.documentRootLoader(spectator.fixture)
        .getHarness(TnTooltipHarness);
      expect(await tooltip.getText()).toBe('iqn.2005-10.org.freenas:ctl');
    });

    it('still lets the Base NQN be copied', async () => {
      const copyButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'content-copy' }));
      await copyButton.click();

      expect(spectator.inject(ClipboardService).copy).toHaveBeenCalledWith('iqn.2005-10.org.freenas:ctl');
    });
  });
});
