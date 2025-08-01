import { ChangeDetectionStrategy, Component, computed, OnInit, signal, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
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

@UntilDestroy()
@Component({
  selector: 'ix-email-card',
  styleUrls: ['./../../common-settings-card.scss'],
  templateUrl: './email-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class EmailCardComponent implements OnInit {
  private slideIn = inject(SlideIn);
  private api = inject(ApiService);

  readonly helptext = helptextSystemEmail;
  protected readonly searchableElements = emailCardElements;

  protected emailConfigState = signal<LoadingState<MailConfig>>({
    isLoading: false,
    value: null,
  });

  protected hasLoadedConfig = computed(() => Boolean(this.emailConfigState().value));

  ngOnInit(): void {
    this.loadEmailConfig();
  }

  private loadEmailConfig(): void {
    this.api.call('mail.config')
      .pipe(
        toLoadingState(),
        untilDestroyed(this),
      )
      .subscribe((state) => this.emailConfigState.set(state));
  }

  protected openEmailSettings(): void {
    this.slideIn.open(EmailFormComponent, { data: this.emailConfigState().value }).pipe(
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.loadEmailConfig());
  }
}
