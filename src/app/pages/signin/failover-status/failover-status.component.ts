import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { FailoverDisabledReason, failoverDisabledReasonLabels } from 'app/enums/failover-disabled-reason.enum';
import { FailoverStatus } from 'app/enums/failover-status.enum';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';

@Component({
  selector: 'ix-failover-status',
  templateUrl: './failover-status.component.html',
  styleUrls: ['./failover-status.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgxSkeletonLoaderModule,
    TranslateModule,
    MapValuePipe,
  ],
})
export class FailoverStatusComponent {
  readonly status = input.required<FailoverStatus | null>();
  readonly failoverIps = input<string[] | null>([]);
  readonly disabledReasons = input<FailoverDisabledReason[] | null>([]);

  readonly disabledReasonLabels = failoverDisabledReasonLabels;

  statusDescriptions: { [status in FailoverStatus]: string } = {
    [FailoverStatus.Single]: '',
    [FailoverStatus.Master]: this.translate.instant('Active {controller}.', { controller: helptextGlobal.Ctrlr }),
    [FailoverStatus.Backup]: this.translate.instant('Standby {controller}.', { controller: helptextGlobal.Ctrlr }),
    [FailoverStatus.Electing]: this.translate.instant('Electing {controller}.', { controller: helptextGlobal.Ctrlr }),
    [FailoverStatus.Importing]: this.translate.instant('Importing pools.'),
    [FailoverStatus.Error]: this.translate.instant('Failover is in an error state.'),
  };

  protected statusMessage = computed(() => {
    switch (true) {
      case !this.disabledReasons(): {
        return this.translate.instant('Checking HA status');
      }
      case this.disabledReasons().length === 0: {
        return this.translate.instant('HA is enabled.');
      }
      case this.disabledReasons()[0] === FailoverDisabledReason.NoSystemReady: {
        return this.translate.instant('HA is reconnecting.');
      }
      case this.disabledReasons()[0] === FailoverDisabledReason.NoFailover:
        return this.translate.instant('HA is administratively disabled.');
      default: {
        return this.translate.instant('HA is in a faulted state');
      }
    }
  });

  protected areReasonsShown = computed(() => this.disabledReasons()?.length > 1);

  constructor(
    private translate: TranslateService,
  ) { }
}
