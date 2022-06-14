import { createHostFactory, SpectatorHost } from '@ngneat/spectator/jest';
import { LicenseInfoInSupport } from 'app/pages/system/general-settings/support/license-info-in-support.interface';
import { SysInfoComponent } from 'app/pages/system/general-settings/support/sys-info/sys-info.component';

describe('SysInfoComponent', () => {
  const systemInfo = {
    version: 'TrueNAS-SCALE-22.12-MASTER-20220318-020017',
    system_product: 'VirtualBox',
    model: 'AMD Ryzen 3 3200G',
    memory: '5 GiB',
    serial: 'ffbb355c',
  };
  const licenseInfo = {
    customer_name: 'iXsystems Inc.',
    features: ['DEDUP', 'FIBRECHANNEL', 'VM'],
    contract_type: 'GOLD',
    expiration_date: '2022-06-10',
    daysLeftinContract: -4,
    add_hardware: 'NONE',
  };

  let spectator: SpectatorHost<SysInfoComponent>;
  const createHost = createHostFactory({
    component: SysInfoComponent,
  });

  beforeEach(() => {
    spectator = createHost('<ix-sys-info [system_info]="systemInfo"></ix-sys-info>', {
      hostProps: {
        systemInfo,
        has_license: false,
      },
    });
  });

  it('it shows a block with system info', () => {
    const sysInfoItems = spectator.queryAll('.sys-info-wrapper .value');
    const sysLicenseBlock = spectator.query('.sys-license-wrapper');

    expect(sysLicenseBlock).not.toBeTruthy();
    expect(sysInfoItems[0]).toHaveText('TrueNAS-SCALE-22.12-MASTER-20220318-020017');
    expect(sysInfoItems[1]).toHaveText('VirtualBox');
    expect(sysInfoItems[2]).toHaveText('AMD Ryzen 3 3200G');
    expect(sysInfoItems[3]).toHaveText('5 GiB');
    expect(sysInfoItems[4]).toHaveText('ffbb355c');
  });

  it('it shows a block with license info', () => {
    spectator.setInput({
      license_info: licenseInfo as LicenseInfoInSupport,
      has_license: true,
    });
    const sysLicenseItems = spectator.queryAll('.sys-license-wrapper .value');
    const sysInfoBlock = spectator.query('.sys-info-wrapper');

    expect(sysInfoBlock).not.toBeTruthy();
    expect(sysLicenseItems[0]).toHaveText('iXsystems Inc.');
    expect(sysLicenseItems[1]).toHaveText('DEDUP, FIBRECHANNEL, VM');
    expect(sysLicenseItems[2]).toHaveText('GOLD');
    expect(sysLicenseItems[3]).toHaveText('2022-06-10');
    expect(sysLicenseItems[4]).toHaveText('( EXPIRED )');
    expect(sysLicenseItems[5]).toHaveText('AMD Ryzen 3 3200G');
    expect(sysLicenseItems[6]).toHaveText('ffbb355c');
    expect(sysLicenseItems[7]).toHaveText('NONE');
  });
});
