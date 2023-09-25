import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AdvancedSettingsComponent } from 'app/pages/system/advanced/advanced-settings.component';
import {
  AllowedAddressesCardComponent,
} from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-card/allowed-addresses-card.component';
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
import {
  SelfEncryptingDriveCardComponent,
} from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-card/self-encrypting-drive-card.component';
import { SessionsCardComponent } from 'app/pages/system/advanced/sessions/sessions-card/sessions-card.component';
import { StorageCardComponent } from 'app/pages/system/advanced/storage/storage-card/storage-card.component';
import { SysctlCardComponent } from 'app/pages/system/advanced/sysctl/sysctl-card/sysctl-card.component';
import { SyslogCardComponent } from 'app/pages/system/advanced/syslog/syslog-card/syslog-card.component';
import { SystemSecurityCardComponent } from 'app/pages/system/advanced/system-security/system-security-card/system-security-card.component';
import { InitShutdownCardComponent } from './init-shutdown/init-shutdown-card/init-shutdown-card.component';

describe('AdvancedSettingsComponent', () => {
  let spectator: Spectator<AdvancedSettingsComponent>;
  const createComponent = createComponentFactory({
    component: AdvancedSettingsComponent,
    declarations: [
      MockComponents(
        ConsoleCardComponent,
        SyslogCardComponent,
        KernelCardComponent,
        CronCardComponent,
        InitShutdownCardComponent,
        SysctlCardComponent,
        StorageCardComponent,
        ReplicationSettingsCardComponent,
        SessionsCardComponent,
        AllowedAddressesCardComponent,
        SelfEncryptingDriveCardComponent,
        IsolatedGpusCardComponent,
        GlobalTwoFactorAuthCardComponent,
        SystemSecurityCardComponent,
      ),
    ],
    providers: [
      mockWebsocket([
        mockCall('system.license', {}),
      ]),
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
    expect(spectator.query(SessionsCardComponent)).toExist();
    expect(spectator.query(AllowedAddressesCardComponent)).toExist();
    expect(spectator.query(SelfEncryptingDriveCardComponent)).toExist();
    expect(spectator.query(IsolatedGpusCardComponent)).toExist();
    expect(spectator.query(GlobalTwoFactorAuthCardComponent)).toExist();
    expect(spectator.query(SystemSecurityCardComponent)).toExist();
  });
});
