import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, Input, OnDestroy, Output,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { WINDOW } from 'app/helpers/window.helper';
import { GmailOauthConfig } from 'app/interfaces/mail-config.interface';
import { OauthMessage } from 'app/interfaces/oauth-message.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { OauthJiraMessage } from 'app/modules/feedback/interfaces/file-ticket.interface';
import { OauthButtonType } from 'app/modules/oauth-button/interfaces/oauth-button.interface';
import { OauthProviderData } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';

@Component({
  selector: 'ix-oauth-button',
  templateUrl: './oauth-button.component.html',
  styleUrls: ['./oauth-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OauthButtonComponent implements OnDestroy {
  @Input() oauthType: OauthButtonType;
  @Input() isLoggedIn = false;
  @Input() disabled = false;
  @Input() oauthUrl: string;
  @Input() testId: string;

  @Output() loggedIn = new EventEmitter();

  private readonly jiraAuthFn = (message: OauthJiraMessage): void => this.onLogInWithJiraSuccess(message);
  private readonly gmailAuthFn = (message: OauthMessage<GmailOauthConfig>): void => {
    this.onLogInWithGmailSuccess(message);
  };

  get buttonText(): string {
    switch (this.oauthType) {
      case OauthButtonType.Jira:
        if (this.isLoggedIn) {
          return this.translate.instant('Logged In To Jira');
        }
        return this.translate.instant('Login To Jira To Submit');

      case OauthButtonType.Provider:
        if (this.isLoggedIn) {
          return this.translate.instant('Logged In To Provider');
        }
        return this.translate.instant('Log In To Provider');

      case OauthButtonType.Gmail:
        if (this.isLoggedIn) {
          return this.translate.instant('Logged In To Gmail');
        }
        return this.translate.instant('Log In To Gmail');
    }

    return '';
  }

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
    switch (this.oauthType) {
      case OauthButtonType.Jira:
        this.onLoginWithJira();
        break;
      case OauthButtonType.Provider:
        this.onLogInWithProvider();
        break;
      case OauthButtonType.Gmail:
        this.onLoginWithGmail();
        break;
    }
  }

  onLoginWithJira(): void {
    this.doCommonOauthLoginLogic(this.jiraAuthFn);
  }

  onLogInWithJiraSuccess(message: OauthJiraMessage): void {
    const token = message.data as string;
    if (typeof token !== 'string') {
      return;
    }
    this.loggedIn.emit(token);
    this.cdr.markForCheck();
  }

  onLoginWithGmail(): void {
    this.doCommonOauthLoginLogic(this.gmailAuthFn);
  }

  onLogInWithGmailSuccess(message: OauthMessage<GmailOauthConfig>): void {
    if (message.data.oauth_portal) {
      if (message.data.error) {
        this.dialogService.error({
          title: this.translate.instant('Error'),
          message: message.data.error,
        });
      } else {
        this.loggedIn.emit(message.data.result);
        this.cdr.markForCheck();
      }
    }
  }

  onLogInWithProvider(): void {
    const authFn = (message: OauthMessage<OauthProviderData>): void => this.onLoggedInWithProviderSuccess(message);
    this.doCommonOauthLoginLogic(authFn);
  }

  onLoggedInWithProviderSuccess = (message: OauthMessage<OauthProviderData>): void => {
    if (message.origin !== 'https://www.truenas.com') {
      return;
    }
    if (!('oauth_portal' in message.data)) {
      return;
    }

    if (message.data.error) {
      this.dialogService.error({
        title: this.translate.instant('Error'),
        message: message.data.error,
      });
      return;
    }

    this.loggedIn.emit(message.data.result);
  };

  doCommonOauthLoginLogic(
    authFn: (
      message: OauthMessage<GmailOauthConfig> | OauthMessage<OauthProviderData> | OauthJiraMessage
    ) => void,
  ): void {
    this.window.removeEventListener('message', authFn, false);
    this.window.open(
      this.oauthUrl + encodeURIComponent(this.window.location.toString()),
      '_blank',
      'width=640,height=480',
    );
    this.window.addEventListener('message', authFn, false);
  }
}
