import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { shareReplay, startWith, switchMap } from 'rxjs';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { AuditFormComponent } from 'app/pages/system/advanced/audit/audit-form/audit-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@Component({
  selector: 'ix-audit-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './audit-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditCardComponent {
  auditConfig$ = this.slideInService.onClose$.pipe(
    startWith(undefined),
    switchMap(() => this.ws.call('audit.config')),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  constructor(
    private slideInService: IxSlideInService,
    private ws: WebSocketService,
    private translate: TranslateService,
  ) {}

  onConfigurePressed(): void {
    this.slideInService.open(AuditFormComponent);
  }

  getEndValue(value: number, processedString: string): string {
    if (!value) {
      return this.translate.instant('None');
    }
    return this.translate.instant(processedString, { value });
  }
}
