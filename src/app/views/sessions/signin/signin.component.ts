import {
  Component, OnInit, ChangeDetectionStrategy,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { WebSocketService } from 'app/services/ws.service';
import { SigninStore } from 'app/views/sessions/signin/store/signin.store';

@UntilDestroy()
@Component({
  templateUrl: './signin.component.html',
  styleUrls: ['./signin.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SigninComponent implements OnInit {
  readonly hasRootPassword$ = this.signinStore.hasRootPassword$;
  readonly failover$ = this.signinStore.failover$;
  readonly hasFailover$ = this.signinStore.hasFailover$;
  readonly canLogin$ = this.signinStore.canLogin$;
  readonly isConnected$ = this.ws.isConnected$;
  readonly hasLoadingIndicator$ = combineLatest([this.signinStore.isLoading$, this.isConnected$]).pipe(
    map(([isLoading, isConnected]) => isLoading || !isConnected),
  );

  constructor(
    private ws: WebSocketService,
    private signinStore: SigninStore,
  ) {}

  ngOnInit(): void {
    this.signinStore.init();
  }
}
