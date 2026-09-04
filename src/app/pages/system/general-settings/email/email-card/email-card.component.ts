import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCardComponent,
  TnCardHeaderDirective,
  TnListComponent,
  TnListItemComponent,
  TnButtonComponent,
  TnCardFooterActionsDirective,
} from '@truenas/ui-components';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { LoadingState, toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextSystemEmail } from 'app/helptext/system/email';
import { MailConfig } from 'app/interfaces/mail-config.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
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
    TnCardHeaderDirective,
    TnListComponent,
    TnListItemComponent,
    UiSearchDirective,
    WithLoadingStateDirective,
    TranslateModule,
    TnButtonComponent,
    TnCardFooterActionsDirective,
  ],
})
export class EmailCardComponent implements OnInit {
  private formPanel = inject(FormSidePanelService);
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
    this.formPanel.open(EmailFormComponent, {
      title: this.translate.instant('Email Options'),
      inputs: { config: this.emailConfigState().value },
    })
      .onSuccess(() => this.loadEmailConfig(), this.destroyRef);
  }
}
