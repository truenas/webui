import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Inject, Input, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { WINDOW } from 'app/helpers/window.helper';
import { GmailOauthConfig } from 'app/interfaces/mail-config.interface';
import { OauthMessage } from 'app/interfaces/oauth-message.interface';
import { OauthJiraMessage } from 'app/interfaces/support.interface';
import { OauthProviderData } from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import { DialogService } from 'app/services/dialog.service';
import { OauthButtonType } from './../../interfaces/oauth-button.interface';

@Component({
  selector: 'ix-oauth-button',
  templateUrl: './oauth-button.component.html',
  styleUrls: ['./oauth-button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OauthButtonComponent {
  @Input() oauthType: OauthButtonType;
  @Input() isLoggedIn = false;
  @Input() oauthUrl: string;
  @Input() testId: string;

  @Output() loggedIn = new EventEmitter();

  get buttonText(): string {
    switch (this.oauthType) {
      case OauthButtonType.Jira:
        if (this.isLoggedIn) {
          return this.translate.instant('Logged In To Jira');
        } else {
          return this.translate.instant('Log In To Jira');
        }
      case OauthButtonType.Provider:
        if (this.isLoggedIn) {
          return this.translate.instant('Logged In To Provider');
        } else {
          return this.translate.instant('Log In To Provider');
        }
      case OauthButtonType.Gmail:
        if (this.isLoggedIn) {
          return this.translate.instant('Logged In To Gmail');
        } else {
          return this.translate.instant('Log In To Gmail');
        }
    }
  }

  constructor(
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    private translate: TranslateService,
    @Inject(WINDOW) private window: Window,
  ) {}

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
    }
  }

  onLoginWithJira(): void {
    const authFn = (message: OauthJiraMessage): void => this.onLogInWithJiraSuccess(message);
    this.doCommonOauthLoginLogic(authFn);
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
    const authFn = (message: OauthMessage<GmailOauthConfig>): void => this.onLogInWithGmailSuccess(message);
    this.doCommonOauthLoginLogic(authFn);
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
