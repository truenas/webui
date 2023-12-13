import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { helptextTopbar } from 'app/helptext/topbar';

@Component({
  selector: 'ix-failover-status',
  templateUrl: './failover-status.component.html',
  styleUrls: ['./failover-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FailoverStatusComponent implements OnChanges {
  @Input() status: FailoverStatus;
  @Input() failoverIps: string[] = [];
  @Input() disabledReasons: FailoverDisabledReason[];

  reasonText = helptextTopbar.ha_disabled_reasons;
  statusMessage = this.translate.instant('Checking HA status');

  statusDescriptions: { [status in FailoverStatus]: string } = {
    [FailoverStatus.Single]: '',
    [FailoverStatus.Master]: this.translate.instant('Active {controller}.', { controller: helptextGlobal.Ctrlr }),
    [FailoverStatus.Backup]: this.translate.instant('Standby {controller}.', { controller: helptextGlobal.Ctrlr }),
    [FailoverStatus.Electing]: this.translate.instant('Electing {controller}.', { controller: helptextGlobal.Ctrlr }),
    [FailoverStatus.Importing]: this.translate.instant('Importing pools.'),
    [FailoverStatus.Error]: this.translate.instant('Failover is in an error state.'),
  };

  areReasonsShown = false;

  constructor(
    private translate: TranslateService,
  ) { }

  ngOnChanges(): void {
    this.updateStatus();
  }

  updateStatus(): void {
    this.areReasonsShown = false;
    if (!this.disabledReasons) {
      return;
    }

    if (this.disabledReasons.length === 0) {
      this.statusMessage = this.translate.instant('HA is enabled.');
      return;
    }

    if (this.disabledReasons.length === 1) {
      if (this.disabledReasons[0] === FailoverDisabledReason.NoSystemReady) {
        this.statusMessage = this.translate.instant('HA is reconnecting.');
      } else if (this.disabledReasons[0] === FailoverDisabledReason.NoFailover) {
        this.statusMessage = this.translate.instant('HA is administratively disabled.');
      }
      return;
    }

    this.areReasonsShown = true;
    this.statusMessage = this.translate.instant('HA is in a faulted state');
  }
}
