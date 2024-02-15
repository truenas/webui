import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  Subject, filter, shareReplay, startWith, switchMap,
} from 'rxjs';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { SystemSecurityFormComponent } from 'app/pages/system/advanced/system-security/system-security-form/system-security-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-system-security-card',
  templateUrl: './system-security-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemSecurityCardComponent {
  private readonly reloadConfig$ = new Subject<void>();
  readonly systemSecurityConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.ws.call('system.security.config').pipe(toLoadingState())),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  constructor(
    private chainedSlideIns: IxChainedSlideInService,
    private ws: WebSocketService,
  ) {}

  openSystemSecuritySettings(config: SystemSecurityConfig): void {
    this.chainedSlideIns.pushComponent(SystemSecurityFormComponent, false, config).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => {
      this.reloadConfig$.next();
    });
  }
}
