import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component,
  computed,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { advancedSettingsElements } from 'app/pages/system/advanced/advanced-settings.elements';
import { FailoverCardComponent } from 'app/pages/system/advanced/failover/failover-card.component';
import { LicenseService } from 'app/services/license.service';
import { AppState } from 'app/store';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';
import { AccessCardComponent } from './access/access-card/access-card.component';
import { AllowedAddressesCardComponent } from './allowed-addresses/allowed-addresses-card/allowed-addresses-card.component';
import { AuditCardComponent } from './audit/audit-card/audit-card.component';
import { ConsoleCardComponent } from './console/console-card/console-card.component';
import { CronCardComponent } from './cron/cron-card/cron-card.component';
import { GlobalTwoFactorAuthCardComponent } from './global-two-factor-auth/global-two-factor-card/global-two-factor-card.component';
import { InitShutdownCardComponent } from './init-shutdown/init-shutdown-card/init-shutdown-card.component';
import { IsolatedGpusCardComponent } from './isolated-gpus/isolated-gpus-card/isolated-gpus-card.component';
import { KernelCardComponent } from './kernel/kernel-card/kernel-card.component';
import { ReplicationSettingsCardComponent } from './replication/replication-settings-card/replication-settings-card.component';
import { SaveDebugButtonComponent } from './save-debug-button/save-debug-button.component';
import { SelfEncryptingDriveCardComponent } from './self-encrypting-drive/self-encrypting-drive-card/self-encrypting-drive-card.component';
import { StorageCardComponent } from './storage/storage-card/storage-card.component';
import { SysctlCardComponent } from './sysctl/sysctl-card/sysctl-card.component';
import { SyslogCardComponent } from './syslog/syslog-card/syslog-card.component';
import { SystemSecurityCardComponent } from './system-security/system-security-card/system-security-card.component';

@UntilDestroy()
@Component({
  selector: 'ix-advanced-settings',
  templateUrl: './advanced-settings.component.html',
  styleUrls: ['./advanced-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SaveDebugButtonComponent,
    UiSearchDirective,
    ConsoleCardComponent,
    SyslogCardComponent,
    AuditCardComponent,
    KernelCardComponent,
    CronCardComponent,
    InitShutdownCardComponent,
    SysctlCardComponent,
    StorageCardComponent,
    ReplicationSettingsCardComponent,
    AccessCardComponent,
    AllowedAddressesCardComponent,
    SelfEncryptingDriveCardComponent,
    IsolatedGpusCardComponent,
    GlobalTwoFactorAuthCardComponent,
    SystemSecurityCardComponent,
    AsyncPipe,
    FailoverCardComponent,
  ],
})
export class AdvancedSettingsComponent {
  protected readonly isSystemLicensed = toSignal(this.api.call('system.security.info.fips_available'));
  protected readonly Role = Role;
  protected readonly searchableElements = advancedSettingsElements;
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  protected readonly hasGlobalEncryption = toSignal(this.api.call('system.advanced.sed_global_password_is_set'));
  protected readonly showSedCard = computed(() => this.isEnterprise() || this.hasGlobalEncryption());
  protected readonly hasFailover$ = this.license.hasFailover$;

  constructor(
    private api: ApiService,
    private store$: Store<AppState>,
    private license: LicenseService,
  ) {}
}
