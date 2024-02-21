import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  Subject, filter, shareReplay, startWith, switchMap, tap,
} from 'rxjs';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { AuditFormComponent } from 'app/pages/system/advanced/audit/audit-form/audit-form.component';
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
    private advancedSettingsService: AdvancedSettingsService,
  ) {}

  onConfigurePressed(): void {
    this.advancedSettingsService.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.pushComponent(AuditFormComponent)),
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
