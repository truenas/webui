import {
  Component, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { combineLatest } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';

@UntilDestroy()
@Component({
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigninComponent implements OnInit {
  readonly managedByTrueCommand$ = this.signinStore.managedByTrueCommand$;
  readonly wasAdminSet$ = this.signinStore.wasAdminSet$;
  readonly failover$ = this.signinStore.failover$;
  readonly hasFailover$ = this.signinStore.hasFailover$;
  readonly canLogin$ = this.signinStore.canLogin$;
  readonly isConnected$ = this.wsManager.isConnected$;
  readonly hasLoadingIndicator$ = combineLatest([this.signinStore.isLoading$, this.isConnected$]).pipe(
    map(([isLoading, isConnected]) => isLoading || !isConnected),
  );

  constructor(
    private wsManager: WebSocketConnectionService,
    private signinStore: SigninStore,
  ) {}

  ngOnInit(): void {
    this.isConnected$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.signinStore.init();
    });
  }
}
