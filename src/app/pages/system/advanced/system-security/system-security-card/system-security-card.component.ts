import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import {
  Subject, filter, shareReplay, startWith, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { SystemSecurityConfig } from 'app/interfaces/system-security-config.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SystemSecurityFormComponent } from 'app/pages/system/advanced/system-security/system-security-form/system-security-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-system-security-card',
  templateUrl: './system-security-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatToolbarRow,
    WithLoadingStateDirective,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    MatList,
    MatListItem,
    TranslateModule,
  ],
})
export class SystemSecurityCardComponent {
  private readonly reloadConfig$ = new Subject<void>();
  protected readonly requiredRoles = [Role.FullAdmin];
  readonly systemSecurityConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.ws.call('system.security.config').pipe(toLoadingState())),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  constructor(
    private chainedSlideIns: ChainedSlideInService,
    private ws: WebSocketService,
  ) {}

  openSystemSecuritySettings(config: SystemSecurityConfig): void {
    this.chainedSlideIns.open(SystemSecurityFormComponent, false, config).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => {
      this.reloadConfig$.next();
    });
  }
}
