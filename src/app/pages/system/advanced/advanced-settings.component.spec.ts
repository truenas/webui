import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxPopperjsContentComponent, NgxPopperjsDirective, NgxPopperjsLooseDirective } from 'ngx-popperjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { AccessCardComponent } from 'app/pages/system/advanced/access/access-card/access-card.component';
import { AdvancedSettingsComponent } from 'app/pages/system/advanced/advanced-settings.component';
import {
  AllowedAddressesCardComponent,
} from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-card/allowed-addresses-card.component';
import { AuditCardComponent } from 'app/pages/system/advanced/audit/audit-card/audit-card.component';
import { ConsoleCardComponent } from 'app/pages/system/advanced/console/console-card/console-card.component';
import { CronCardComponent } from 'app/pages/system/advanced/cron/cron-card/cron-card.component';
import { GlobalTwoFactorAuthCardComponent } from 'app/pages/system/advanced/global-two-factor-auth/global-two-factor-card/global-two-factor-card.component';
import {
  IsolatedGpusCardComponent,
} from 'app/pages/system/advanced/isolated-gpus/isolated-gpus-card/isolated-gpus-card.component';
import { KernelCardComponent } from 'app/pages/system/advanced/kernel/kernel-card/kernel-card.component';
import {
  ReplicationSettingsCardComponent,
} from 'app/pages/system/advanced/replication/replication-settings-card/replication-settings-card.component';
import { SaveDebugButtonComponent } from 'app/pages/system/advanced/save-debug-button/save-debug-button.component';
import {
  SelfEncryptingDriveCardComponent,
} from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-card/self-encrypting-drive-card.component';
import { StorageCardComponent } from 'app/pages/system/advanced/storage/storage-card/storage-card.component';
import { SysctlCardComponent } from 'app/pages/system/advanced/sysctl/sysctl-card/sysctl-card.component';
import { SyslogCardComponent } from 'app/pages/system/advanced/syslog/syslog-card/syslog-card.component';
import { SystemSecurityCardComponent } from 'app/pages/system/advanced/system-security/system-security-card/system-security-card.component';
import { InitShutdownCardComponent } from './init-shutdown/init-shutdown-card/init-shutdown-card.component';

describe('AdvancedSettingsComponent', () => {
  let spectator: Spectator<AdvancedSettingsComponent>;
  const createComponent = createComponentFactory({
    component: AdvancedSettingsComponent,
    imports: [
      NgxPopperjsContentComponent,
      NgxPopperjsDirective,
      NgxPopperjsLooseDirective,
      MockComponents(
        PageHeaderComponent,
        ConsoleCardComponent,
        SyslogCardComponent,
        KernelCardComponent,
        CronCardComponent,
        InitShutdownCardComponent,
        SysctlCardComponent,
        StorageCardComponent,
        ReplicationSettingsCardComponent,
        AccessCardComponent,
        AuditCardComponent,
        AllowedAddressesCardComponent,
        SelfEncryptingDriveCardComponent,
        IsolatedGpusCardComponent,
        GlobalTwoFactorAuthCardComponent,
        SystemSecurityCardComponent,
        SaveDebugButtonComponent,
      ),
    ],
    providers: [
      mockApi([
        mockCall('system.security.info.fips_available', true),
      ]),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows cards with advanced settings', () => {
    expect(spectator.query(ConsoleCardComponent)).toExist();
    expect(spectator.query(SyslogCardComponent)).toExist();
    expect(spectator.query(KernelCardComponent)).toExist();
    expect(spectator.query(CronCardComponent)).toExist();
    expect(spectator.query(InitShutdownCardComponent)).toExist();
    expect(spectator.query(SysctlCardComponent)).toExist();
    expect(spectator.query(StorageCardComponent)).toExist();
    expect(spectator.query(ReplicationSettingsCardComponent)).toExist();
    expect(spectator.query(AccessCardComponent)).toExist();
    expect(spectator.query(AuditCardComponent)).toExist();
    expect(spectator.query(AllowedAddressesCardComponent)).toExist();
    expect(spectator.query(SelfEncryptingDriveCardComponent)).toExist();
    expect(spectator.query(IsolatedGpusCardComponent)).toExist();
    expect(spectator.query(GlobalTwoFactorAuthCardComponent)).toExist();
    expect(spectator.query(SystemSecurityCardComponent)).toExist();
  });
});
