import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import network_interfaces_helptext from 'app/helptext/network/interfaces/interfaces-list';
import helptext from 'app/helptext/topbar';
import { DialogService } from 'app/services/dialog.service';
import { AppState } from 'app/store';
import { checkinIndicatorPressed } from 'app/store/network-interfaces/network-interfaces.actions';
import {
  selectHasPendingNetworkChanges,
  selectNetworkInterfacesCheckinWaiting,
} from 'app/store/network-interfaces/network-interfaces.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-checkin-indicator',
  templateUrl: './checkin-indicator.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckinIndicatorComponent implements OnInit {
  protected hasPendingNetworkChanges$ = this.store$.select(selectHasPendingNetworkChanges);

  protected readonly tooltips = helptext.mat_tooltips;

  private isWaitingForCheckin = false;

  constructor(
    private store$: Store<AppState>,
    private dialogService: DialogService,
    private translate: TranslateService,
    private router: Router,
  ) {}

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
      .pipe(untilDestroyed(this))
      .subscribe((checkinWaiting) => {
        this.isWaitingForCheckin = Boolean(checkinWaiting);
      });
  }

  private showCheckinWaitingDialog(): void {
    this.store$.dispatch(checkinIndicatorPressed());
  }

  private showPendingNetworkChangesDialog(): void {
    this.dialogService.confirm({
      title: this.translate.instant(network_interfaces_helptext.pending_changes_title),
      message: this.translate.instant(network_interfaces_helptext.pending_changes_message),
      hideCheckbox: true,
      buttonText: this.translate.instant('Continue'),
    }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.router.navigate(['/network']);
    });
  }
}
