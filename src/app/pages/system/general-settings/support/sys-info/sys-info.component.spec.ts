import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContractType } from 'app/interfaces/system-info.interface';
import { LicenseInfoInSupport } from 'app/pages/system/general-settings/support/license-info-in-support.interface';
import { SysInfoComponent } from 'app/pages/system/general-settings/support/sys-info/sys-info.component';
import { SystemInfoInSupport } from 'app/pages/system/general-settings/support/system-info-in-support.interface';

describe('SysInfoComponent', () => {
  const systemInfo = {
    version: 'TrueNAS-SCALE-22.12-MASTER-20220318-020017',
    system_product: 'VirtualBox',
    model: 'AMD Ryzen 3 3200G',
    memory: '5 GiB',
    system_serial: 'ffbb355c',
  };
  const licenseInfo: LicenseInfoInSupport = {
    contractType: ContractType.Gold,
    model: 'M60',
    expirationDateDisplay: '2022-06-10',
    daysLeftInContract: -4,
    featureNames: ['DEDUP', 'FIBRECHANNEL', 'VM'],
    additionalHardware: null,
    serials: ['abcdefgh12345678'],
  };
  let spectator: Spectator<SysInfoComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SysInfoComponent,
    providers: [
      mockAuth(),
    ],
  });

  function getInfoRows(): Record<string, string> {
    const values = spectator.queryAll('mat-list-item .value');
    const labels = spectator.queryAll('mat-list-item .label');
    return values.reduce((acc, item, i) => {
      return { ...acc, [labels[i].textContent!]: item.textContent!.replace(/\s{2,}/g, ' ').trim() };
    }, {} as Record<string, string>);
  }

  beforeEach(() => {
    spectator = createComponent({
      props: {
        systemInfo: systemInfo as SystemInfoInSupport,
        hasLicense: false,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows a block with system info', () => {
    const infoRows = getInfoRows();

    expect(infoRows).toEqual({
      'Memory:': systemInfo.memory,
      'Model:': systemInfo.model,
      'OS Version:': systemInfo.version,
      'Product:': systemInfo.system_product,
      'System Serial:': systemInfo.system_serial,
    });
  });

  it('shows a block with license info', () => {
    spectator.setInput({
      licenseInfo,
      hasLicense: true,
      isProactiveSupportAvailable: true,
    });

    const infoRows = getInfoRows();

    expect(infoRows).toEqual({
      'Model:': licenseInfo.model,
      'Licensed Serials:': licenseInfo.serials.join(' / '),
      'System Serial:': systemInfo.system_serial,
      'Features:': licenseInfo.featureNames.join(', '),
      'Contract Type:': 'Gold',
      'Expiration Date:': `${licenseInfo.expirationDateDisplay} (EXPIRED)`,
    });
  });

  describe('Proactive support status', () => {
    beforeEach(() => {
      spectator.setInput({
        licenseInfo,
        hasLicense: true,
        isProactiveSupportAvailable: true,
        isProactiveSupportEnabled: true,
      });
    });

    it('shows proactive support row when enabled', () => {
      const proactiveRow = spectator.query('.proactive-status');
      expect(proactiveRow).toExist();
    });

    it('has Manage button that emits editContacts event', async () => {
      let editContactsEmitted = false;
      spectator.output('editContacts').subscribe(() => {
        editContactsEmitted = true;
      });

      const manageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage' }));
      await manageButton.click();

      expect(editContactsEmitted).toBe(true);
    });

    it('does not show proactive support row when not enabled but available', () => {
      spectator.setInput({
        isProactiveSupportAvailable: true,
        isProactiveSupportEnabled: false,
      });

      const proactiveRow = spectator.query('.proactive-status');
      expect(proactiveRow).not.toExist();
    });
  });

  describe('Proactive support not available', () => {
    beforeEach(() => {
      spectator.setInput({
        licenseInfo,
        hasLicense: true,
        isProactiveSupportAvailable: false,
        isProactiveSupportEnabled: false,
      });
    });

    it('shows proactive support row with disabled Manage button and Not Available value', async () => {
      expect(spectator.query('.proactive-status')).toExist();
      expect(spectator.query('.proactive-status .value')?.textContent?.trim()).toBe('Not Available');

      const manageButton = await loader.getHarness(MatButtonHarness.with({ text: 'Manage' }));
      expect(await manageButton.isDisabled()).toBe(true);
    });
  });

  describe('Production toggle', () => {
    it('shows production toggle in Model row when productionControl is provided', () => {
      const productionControl = new FormControl(false);
      spectator.setInput({
        licenseInfo,
        hasLicense: true,
        isProactiveSupportAvailable: true,
        productionControl,
      });

      const modelRow = spectator.query('.model-row');
      expect(modelRow).toExist();

      const toggle = spectator.query('.model-row ix-slide-toggle');
      expect(toggle).toExist();
    });
  });
});
