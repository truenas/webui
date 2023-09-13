import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import helptext from 'app/helptext/topbar';
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
  statusText = '';

  protected readonly FailoverDisabledReason = FailoverDisabledReason;

  private isStatusPanelOpen = false;
  private statusPanelRef: MatDialogRef<HaStatusPopoverComponent>;

  constructor(
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
  ) { }

  get isReconnecting(): boolean {
    return this.failoverDisabledReasons[0] === FailoverDisabledReason.NoSystemReady;
  }

  ngOnInit(): void {
    this.listenForHaStatus();
  }

  showHaPopover(): void {
    if (this.isStatusPanelOpen) {
      this.statusPanelRef.close(true);
    } else {
      this.statusPanelRef = this.dialog.open(HaStatusPopoverComponent, {
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
      this.statusText = haStatus.hasHa ? helptext.ha_status_text_enabled : helptext.ha_status_text_disabled;
      this.cdr.markForCheck();
    });
  }
}
