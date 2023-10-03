import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import {
  HaStatusPopoverComponent,
} from 'app/modules/layout/components/topbar/ha-status-icon/ha-status-popover/ha-status-popover.component';
import { topbarDialogPosition } from 'app/modules/layout/components/topbar/topbar-dialog-position.constant';
import { AppState } from 'app/store';
import { selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-ha-status-icon',
  templateUrl: './ha-status-icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HaStatusIconComponent implements OnInit {

  isFailoverLicensed$ = this.store$.select(selectIsHaLicensed);

  failoverDisabledReasons: FailoverDisabledReason[] = [];

  protected readonly FailoverDisabledReason = FailoverDisabledReason;

  private isStatusPanelOpen = false;
  private statusPanelRef: MatDialogRef<HaStatusPopoverComponent>;

  constructor(
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private matDialog: MatDialog,
    private translate: TranslateService,
  ) { }

  get isReconnecting(): boolean {
    return this.failoverDisabledReasons[0] === FailoverDisabledReason.NoSystemReady;
  }

  get isDisabled(): boolean {
    return this.failoverDisabledReasons.length > 0 && !this.isReconnecting;
  }

  get statusText(): string {
    switch (true) {
      case this.isReconnecting:
        return this.translate.instant('HA is reconnecting');
      case this.isDisabled:
        return this.translate.instant('HA is disabled');
      default:
        return this.translate.instant('HA is enabled');
    }
  }

  ngOnInit(): void {
    this.listenForHaStatus();
  }

  showHaPopover(): void {
    if (this.isStatusPanelOpen) {
      this.statusPanelRef.close(true);
    } else {
      this.statusPanelRef = this.matDialog.open(HaStatusPopoverComponent, {
        hasBackdrop: true,
        panelClass: 'topbar-panel',
        position: topbarDialogPosition,
        data: this.failoverDisabledReasons,
      });
    }
  }

  private listenForHaStatus(): void {
    this.store$.select(selectHaStatus).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe((haStatus) => {
      this.failoverDisabledReasons = haStatus.reasons;
      this.cdr.markForCheck();
    });
  }
}
