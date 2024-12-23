import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, Inject, input, OnDestroy, output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { WINDOW } from 'app/helpers/window.helper';
import { MailSendMethod, MailOauthConfig } from 'app/interfaces/mail-config.interface';
import { OauthMessage } from 'app/interfaces/oauth-message.interface';
import { OauthButtonType } from 'app/modules/buttons/oauth-button/interfaces/oauth-button.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { OauthJiraMessage } from 'app/modules/feedback/interfaces/file-ticket.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { OauthProviderData } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';

@Component({
  selector: 'ix-oauth-button',
  templateUrl: './oauth-button.component.html',
  styleUrls: ['./oauth-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class OauthButtonComponent implements OnDestroy {
  readonly oauthType = input<OauthButtonType>();
  readonly isLoggedIn = input(false);
  readonly disabled = input(false);
  readonly oauthUrl = input<string>();
  // TODO: Figure out in another way.
  readonly testId = input.required<string>();

  readonly loggedIn = output<unknown>();

  private readonly jiraAuthFn = (message: OauthJiraMessage): void => this.onLogInWithJiraSuccess(message);
  private readonly gmailAuthFn = (message: OauthMessage<MailOauthConfig>): void => {
    this.onLogInWithGmailSuccess(message);
  };

  private readonly outlookAuthFn = (message: OauthMessage<MailOauthConfig>): void => {
    this.onLogInWithOutlookSuccess(message);
  };

  protected buttonText = computed(() => {
    switch (this.oauthType()) {
      case OauthButtonType.Jira:
        if (this.isLoggedIn()) {
          return this.translate.instant('Logged In To Jira');
        }
        return this.translate.instant('Login To Jira To Submit');

      case OauthButtonType.Provider:
        if (this.isLoggedIn()) {
          return this.translate.instant('Logged In To Provider');
        }
        return this.translate.instant('Log In To Provider');

      case OauthButtonType.Gmail:
        if (this.isLoggedIn()) {
          return this.translate.instant('Logged In To Gmail');
        }
        return this.translate.instant('Log In To Gmail');

      case OauthButtonType.Outlook:
        if (this.isLoggedIn()) {
          return this.translate.instant('Logged In To Outlook');
        }
        return this.translate.instant('Log In To Outlook');
    }

    return '';
  });

  constructor(
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private translate: TranslateService,
    @Inject(WINDOW) private window: Window,
  ) {}

  ngOnDestroy(): void {
    this.window.removeEventListener('message', this.jiraAuthFn, false);
    this.window.removeEventListener('message', this.gmailAuthFn, false);
  }

  onOauthClicked(): void {
    switch (this.oauthType()) {
      case OauthButtonType.Jira:
        this.onLoginWithJira();
        break;
      case OauthButtonType.Provider:
        this.onLogInWithProvider();
        break;
      case OauthButtonType.Gmail:
        this.onLoginWithGmail();
        break;
      case OauthButtonType.Outlook:
        this.onLoginWithOutlook();
        break;
    }
  }

  private onLoginWithJira(): void {
    this.doCommonOauthLoginLogic(this.jiraAuthFn);
  }

  private onLogInWithProvider(): void {
    const authFn = (message: OauthMessage<OauthProviderData>): void => this.onLoggedInWithProviderSuccess(message);
    this.doCommonOauthLoginLogic(authFn);
  }

  private onLoginWithGmail(): void {
    this.doCommonOauthLoginLogic(this.gmailAuthFn);
  }

  private onLoginWithOutlook(): void {
    this.doCommonOauthLoginLogic(this.outlookAuthFn);
  }

  private onLogInWithJiraSuccess(message: OauthJiraMessage): void {
    const token = message.data as string;
    if (typeof token !== 'string') {
      return;
    }
    this.loggedIn.emit(token);
    this.cdr.markForCheck();
  }

  private onLogInWithGmailSuccess(message: OauthMessage<MailOauthConfig>): void {
    if (message.data.oauth_portal) {
      if (message.data.error) {
        this.handleProviderError(message.data.error);
      } else {
        this.loggedIn.emit({
          ...message.data.result,
          provider: MailSendMethod.Gmail,
        });
        this.cdr.markForCheck();
      }
    }
  }

  private onLogInWithOutlookSuccess(message: OauthMessage<MailOauthConfig>): void {
    if (message.data.oauth_portal) {
      if (message.data.error) {
        this.handleProviderError(message.data.error);
      } else {
        this.loggedIn.emit({
          ...message.data.result,
          provider: MailSendMethod.Outlook,
        });
        this.cdr.markForCheck();
      }
    }
  }

  private onLoggedInWithProviderSuccess = (message: OauthMessage<OauthProviderData>): void => {
    if (message.origin !== 'https://www.truenas.com') {
      return;
    }
    if (!('oauth_portal' in message.data)) {
      return;
    }

    if (message.data.error) {
      this.handleProviderError(message.data.error);
      return;
    }

    this.loggedIn.emit(message.data.result);
  };

  private doCommonOauthLoginLogic(
    authFn: (
      message: OauthMessage<MailOauthConfig> | OauthMessage<OauthProviderData> | OauthJiraMessage
    ) => void,
  ): void {
    this.window.removeEventListener('message', authFn, false);
    this.window.open(
      this.oauthUrl() + encodeURIComponent(this.window.location.toString()),
      '_blank',
      'width=640,height=480',
    );
    this.window.addEventListener('message', authFn, false);
  }

  private handleProviderError(error: string): void {
    this.dialogService.closeAllDialogs();

    this.dialogService.error({
      title: this.translate.instant('Error'),
      message: error.includes('Missing code parameter in response')
        ? this.translate.instant('Login was canceled. Please try again if you want to connect your account.')
        : this.translate.instant(error),
    });
  }
}
