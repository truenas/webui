import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { filter } from 'rxjs/operators';
import { helptextInterfaces } from 'app/helptext/network/interfaces/interfaces-list';
import { helptextTopbar } from 'app/helptext/topbar';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AppState } from 'app/store';
import { checkinIndicatorPressed } from 'app/store/network-interfaces/network-interfaces.actions';
import {
  selectHasPendingNetworkChanges,
  selectNetworkInterfacesCheckinWaiting,
} from 'app/store/network-interfaces/network-interfaces.selectors';

@Component({
  selector: 'ix-checkin-indicator',
  templateUrl: './checkin-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconButton,
    MatTooltip,
    TnIconComponent,
    AsyncPipe,
    TranslateModule,
    TestDirective,
  ],
})
export class CheckinIndicatorComponent implements OnInit {
  private store$ = inject<Store<AppState>>(Store);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  protected hasPendingNetworkChanges$ = this.store$.select(selectHasPendingNetworkChanges);

  protected readonly tooltips = helptextTopbar.tooltips;

  private isWaitingForCheckin = false;

  ngOnInit(): void {
    this.listenToCheckinStatus();
  }

  showNetworkChangesDialog(): void {
    if (this.isWaitingForCheckin) {
      this.showCheckinWaitingDialog();
    } else {
      this.showPendingNetworkChangesDialog();
    }
  }

  private listenToCheckinStatus(): void {
    this.store$.select(selectNetworkInterfacesCheckinWaiting)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((checkinWaiting) => {
        this.isWaitingForCheckin = Boolean(checkinWaiting);
      });
  }

  private showCheckinWaitingDialog(): void {
    this.store$.dispatch(checkinIndicatorPressed());
  }

  private showPendingNetworkChangesDialog(): void {
    this.dialogService.confirm({
      title: this.translate.instant(helptextInterfaces.pendingChangesTitle),
      message: this.translate.instant(helptextInterfaces.pendingChangesMessage),
      hideCheckbox: true,
      buttonText: this.translate.instant('Continue'),
    }).pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.router.navigate(['/system/network']);
    });
  }
}
