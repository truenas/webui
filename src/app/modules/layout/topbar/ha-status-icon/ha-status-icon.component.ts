import { DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { TnDialog, TnIconButtonComponent } from '@truenas/ui-components';
import { filter } from 'rxjs/operators';
import { FailoverDisabledReason } from 'app/enums/failover-disabled-reason.enum';
import {
  HaStatusPopoverComponent,
} from 'app/modules/layout/topbar/ha-status-icon/ha-status-popover/ha-status-popover.component';
import { topbarDialogPositionStrategy } from 'app/modules/layout/topbar/topbar-dialog-position.constant';
import { AppState } from 'app/store';
import { selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@Component({
  selector: 'ix-ha-status-icon',
  templateUrl: './ha-status-icon.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnIconButtonComponent,
  ],
})
export class HaStatusIconComponent implements OnInit {
  private store$ = inject<Store<AppState>>(Store);
  private tnDialog = inject(TnDialog);
  private overlay = inject(Overlay);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  protected readonly isFailoverLicensed = toSignal(this.store$.select(selectIsHaLicensed), { initialValue: false });

  private readonly failoverDisabledReasons = signal<FailoverDisabledReason[]>([]);

  private isStatusPanelOpen = false;
  private statusPanelRef: DialogRef<unknown, HaStatusPopoverComponent>;

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
      this.statusPanelRef = this.tnDialog.open(HaStatusPopoverComponent, {
        hasBackdrop: true,
        panelClass: 'topbar-panel',
        positionStrategy: topbarDialogPositionStrategy(this.overlay),
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
