import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { TnIconButtonComponent } from '@truenas/ui-components';
import { filter } from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import {
  HaStatusPopoverComponent,
} from 'app/modules/layout/topbar/ha-status-icon/ha-status-popover/ha-status-popover.component';
import { topbarDialogPosition } from 'app/modules/layout/topbar/topbar-dialog-position.constant';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@Component({
  selector: 'ix-ha-status-icon',
  templateUrl: './ha-status-icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
    AsyncPipe,
    TestDirective,
  ],
})
export class HaStatusIconComponent implements OnInit {
  private store$ = inject<Store<AppState>>(Store);
  private matDialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  protected readonly isFailoverLicensed$ = this.store$.select(selectIsHaLicensed);

  private readonly failoverDisabledReasons = signal<FailoverDisabledReason[]>([]);

  private isStatusPanelOpen = false;
  private statusPanelRef: MatDialogRef<HaStatusPopoverComponent>;

  private readonly isReconnecting = computed(() => {
    return this.failoverDisabledReasons()[0] === FailoverDisabledReason.NoSystemReady;
  });

  protected readonly isDisabled = computed(() => {
    return this.failoverDisabledReasons().length > 0 && !this.isReconnecting();
  });

  protected readonly iconName = computed(() => {
    if (this.isReconnecting()) {
      return 'tn-ha-reconnecting';
    }
    if (this.isDisabled()) {
      return 'tn-ha-disabled';
    }
    return 'tn-ha-enabled';
  });

  protected readonly statusText = computed(() => {
    if (this.isReconnecting()) {
      return this.translate.instant('HA is reconnecting');
    }
    if (this.isDisabled()) {
      return this.translate.instant('HA is disabled');
    }
    return this.translate.instant('HA is enabled');
  });

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
        data: this.failoverDisabledReasons(),
      });
    }
  }

  private listenForHaStatus(): void {
    this.store$.select(selectHaStatus).pipe(
      filter(Boolean),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((haStatus) => {
      this.failoverDisabledReasons.set(haStatus.reasons || []);
    });
  }
}
