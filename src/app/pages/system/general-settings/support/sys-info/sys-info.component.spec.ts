import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
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
  const licenseInfo = {
    customer_name: 'iXsystems Inc.',
    features: ['DEDUP', 'FIBRECHANNEL', 'VM'],
    model: 'M60',
    contract_type: 'GOLD',
    expiration_date: '2022-06-10',
    daysLeftinContract: -4,
    add_hardware: 'NONE',
    system_serial: 'abcdefgh12345678',
  };
  let spectator: Spectator<SysInfoComponent>;
  const createComponent = createComponentFactory({
    component: SysInfoComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        systemInfo: systemInfo as SystemInfoInSupport,
        hasLicense: false,
      },
    });
  });

  it('shows a block with system info', () => {
    const sysInfoValues = spectator.queryAll('.sys-info-wrapper .value');
    const sysInfoLabels = spectator.queryAll('.sys-info-wrapper .label');
    const infoRows = sysInfoValues.reduce((acc, item, i) => {
      return { ...acc, ...{ [sysInfoLabels[i].textContent!]: item.textContent } };
    }, {} as Record<string, string>);
    const sysLicenseBlock = spectator.query('.sys-license-wrapper');

    expect(sysLicenseBlock).not.toBeTruthy();
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
      licenseInfo: licenseInfo as LicenseInfoInSupport,
      hasLicense: true,
    });
    const sysLicenseValues = spectator.queryAll('.sys-license-wrapper .value');
    const sysLicenseLabels = spectator.queryAll('.sys-license-wrapper .label');
    const infoRows = sysLicenseValues.reduce((acc, item, i) => {
      return { ...acc, ...{ [sysLicenseLabels[i].textContent!]: item.textContent!.replace(/\s{2,}/g, ' ').trim() } };
    }, {} as Record<string, string>);
    const sysInfoBlock = spectator.query('.sys-info-wrapper');

    expect(sysInfoBlock).not.toBeTruthy();
    expect(infoRows).toEqual({
      'Model:': licenseInfo.model,
      'Licensed Serials:': licenseInfo.system_serial,
      'System Serial:': systemInfo.system_serial,
      'Features:': licenseInfo.features.join(', '),
      'Contract Type:': 'Gold',
      'Expiration Date:': `${licenseInfo.expiration_date} ( EXPIRED )`,
      'Additional Hardware:': licenseInfo.add_hardware,
    });
  });
});
