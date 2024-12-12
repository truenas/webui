import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Subject, filter, shareReplay, startWith, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { auditCardElements } from 'app/pages/system/advanced/audit/audit-card/audit-card.elements';
import { AuditFormComponent } from 'app/pages/system/advanced/audit/audit-form/audit-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy(this)
@Component({
  selector: 'ix-audit-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './audit-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditCardComponent {
  private readonly reloadConfig$ = new Subject<void>();
  protected readonly searchableElements = auditCardElements;
  protected readonly requiredRoles = [Role.SystemAuditWrite];
  auditConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.ws.call('audit.config')),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  constructor(
    private chainedSlideIns: IxChainedSlideInService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private firstTimeWarning: FirstTimeWarningService,
  ) {}

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.open(AuditFormComponent)),
      filter((response) => !!response.response),
      tap(() => {
        this.reloadConfig$.next();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  getEndValue(value: number, processedString: string): string {
    if (!value) {
      return this.translate.instant('None');
    }
    return this.translate.instant(processedString, { value });
  }
}
