import { ChangeDetectionStrategy, Component, DestroyRef, computed, OnInit, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCardComponent,
  TnListComponent,
  TnListItemComponent,
  type TnCardAction,
} from '@truenas/ui-components';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { LoadingState, toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextSystemEmail } from 'app/helptext/system/email';
import { MailConfig } from 'app/interfaces/mail-config.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { emailCardElements } from 'app/pages/system/general-settings/email/email-card/email-card.elements';
import { EmailFormComponent } from 'app/pages/system/general-settings/email/email-form/email-form.component';

@Component({
  selector: 'ix-email-card',
  styleUrls: ['./../../common-settings-card.scss'],
  templateUrl: './email-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnListComponent,
    TnListItemComponent,
    UiSearchDirective,
    WithLoadingStateDirective,
    TranslateModule,
  ],
})
export class EmailCardComponent implements OnInit {
  private slideIn = inject(SlideIn);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  readonly helptext = helptextSystemEmail;
  protected readonly searchableElements = emailCardElements;

  protected emailConfigState = signal<LoadingState<MailConfig>>({
    isLoading: false,
    value: null,
  });

  protected hasLoadedConfig = computed(() => Boolean(this.emailConfigState().value));

  protected settingsAction = computed<TnCardAction>(() => ({
    label: this.translate.instant('Settings'),
    testId: 'email-settings',
    disabled: !this.hasLoadedConfig(),
    handler: () => this.openEmailSettings(),
  }));

  ngOnInit(): void {
    this.loadEmailConfig();
  }

  private loadEmailConfig(): void {
    this.api.call('mail.config')
      .pipe(
        toLoadingState(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((state) => this.emailConfigState.set(state));
  }

  protected openEmailSettings(): void {
    this.slideIn.open(EmailFormComponent, { data: this.emailConfigState().value })
      .onSuccess(() => this.loadEmailConfig(), this.destroyRef);
  }
}
