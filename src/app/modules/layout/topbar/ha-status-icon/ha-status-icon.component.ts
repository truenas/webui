import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import {
  HaStatusPopoverComponent,
} from 'app/modules/layout/topbar/ha-status-icon/ha-status-popover/ha-status-popover.component';
import { topbarDialogPosition } from 'app/modules/layout/topbar/topbar-dialog-position.constant';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-ha-status-icon',
  templateUrl: './ha-status-icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatIconButton,
    MatTooltip,
    IxIconComponent,
    AsyncPipe,
    TranslateModule,
    TestDirective,
  ],
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
      this.failoverDisabledReasons = haStatus.reasons || [];
      this.cdr.markForCheck();
    });
  }
}
