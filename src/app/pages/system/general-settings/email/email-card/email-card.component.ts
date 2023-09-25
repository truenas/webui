import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable, of } from 'rxjs';
import { LoadingState, toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextSystemEmail } from 'app/helptext/system/email';
import { MailConfig } from 'app/interfaces/mail-config.interface';
import { EmailFormComponent } from 'app/pages/system/general-settings/email/email-form/email-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-email-card',
  templateUrl: './email-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailCardComponent {
  readonly helptext = helptextSystemEmail;

  emailConfig$: Observable<LoadingState<MailConfig>> = this.ws.call('mail.config').pipe(toLoadingState());

  constructor(
    private slideInService: IxSlideInService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {}

  openEmailSettings(config: MailConfig): void {
    const slideInRef = this.slideInService.open(EmailFormComponent, { data: config });

    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
      this.ws.call('mail.config').pipe(untilDestroyed(this)).subscribe((result) => {
        this.emailConfig$ = of(result).pipe(toLoadingState());
        this.cdr.markForCheck();
      });
    });
  }
}
