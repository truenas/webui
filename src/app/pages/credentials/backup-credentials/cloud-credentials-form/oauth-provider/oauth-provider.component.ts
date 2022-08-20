import {
  ChangeDetectionStrategy, Component, EventEmitter, Inject, Input, Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { OauthMessage } from 'app/interfaces/oauth-message.interface';
import { DialogService } from 'app/services';

export interface OauthProviderData {
  client_id: string;
  client_secret: string;
  token?: string;
  [key: string]: unknown;
}

@Component({
  selector: 'ix-oauth-provider-authentication',
  templateUrl: './oauth-provider.component.html',
  styleUrls: ['./oauth-provider.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OauthProviderComponent {
  @Input() oauthUrl: string;
  @Output() authenticated = new EventEmitter<Record<string, unknown>>();

  form = this.formBuilder.group({
    client_id: [''],
    client_secret: [''],
  });

  readonly helptext = helptext;

  constructor(
    private formBuilder: FormBuilder,
    private dialogService: DialogService,
    private translate: TranslateService,
    @Inject(WINDOW) private window: Window,
  ) { }

  onLoginPressed(): void {
    this.window.open(this.oauthUrl + '?origin=' + encodeURIComponent(window.location.toString()), '_blank', 'width=640,height=480');

    this.window.addEventListener('message', this.onOauthMessage, false);
  }

  onOauthMessage = (message: OauthMessage<OauthProviderData>): void => {
    this.window.removeEventListener('message', this.onOauthMessage);

    if (!('oauth_portal' in message.data)) {
      return;
    }

    if (message.data.error) {
      this.dialogService.errorReport(this.translate.instant('Error'), message.data.error);
      return;
    }

    this.form.patchValue(message.data.result);
    this.authenticated.emit(message.data.result);
  };
}
