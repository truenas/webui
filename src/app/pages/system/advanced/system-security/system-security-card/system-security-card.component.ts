import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { LoadingState, toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { SystemSecurityFormComponent } from 'app/pages/system/advanced/system-security/system-security-form/system-security-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-system-security-card',
  templateUrl: './system-security-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SystemSecurityCardComponent {
  systemSecurityConfig$: Observable<LoadingState<SystemSecurityConfig>> = this.ws.call('system.security.config').pipe(toLoadingState());

  constructor(
    private slideInService: IxSlideInService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {}

  openSystemSecuritySettings(config: SystemSecurityConfig): void {
    const slideInRef = this.slideInService.open(SystemSecurityFormComponent, { data: config });

    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
      this.ws.call('system.security.config').pipe(untilDestroyed(this)).subscribe((result) => {
        this.systemSecurityConfig$ = of(result).pipe(toLoadingState());
        this.cdr.markForCheck();
      });
    });
  }
}
