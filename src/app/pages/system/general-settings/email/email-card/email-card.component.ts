import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, filter, of } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { LoadingState, toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextSystemEmail } from 'app/helptext/system/email';
import { MailConfig } from 'app/interfaces/mail-config.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { emailCardElements } from 'app/pages/system/general-settings/email/email-card/email-card.elements';
import { EmailFormComponent } from 'app/pages/system/general-settings/email/email-form/email-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-email-card',
  templateUrl: './email-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    MatButton,
    TestDirective,
    MatCardContent,
    MatList,
    MatListItem,
    WithLoadingStateDirective,
    TranslateModule,
  ],
})
export class EmailCardComponent {
  readonly helptext = helptextSystemEmail;
  protected readonly searchableElements = emailCardElements;

  emailConfig$: Observable<LoadingState<MailConfig>> = this.api.call('mail.config').pipe(toLoadingState());

  constructor(
    private slideIn: SlideIn,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private errorHandler: ErrorHandlerService,
  ) {}

  openEmailSettings(): void {
    this.api.call('mail.config')
      .pipe(
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe((config) => {
        this.slideIn.open(EmailFormComponent, { data: config }).pipe(
          filter((response) => !!response.response),
          untilDestroyed(this),
        ).subscribe(() => {
          this.api.call('mail.config').pipe(untilDestroyed(this)).subscribe((result) => {
            this.emailConfig$ = of(result).pipe(toLoadingState());
            this.cdr.markForCheck();
          });
        });
      });
  }
}
