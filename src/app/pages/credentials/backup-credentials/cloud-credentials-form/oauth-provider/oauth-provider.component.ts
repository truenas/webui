import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { OauthButtonType } from 'app/modules/oauth-button/interfaces/oauth-button.interface';

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
  readonly oauthType = OauthButtonType;

  get hasOauthAuthorization(): boolean {
    return Boolean(this.form.value.client_id && this.form.value.client_secret);
  }

  constructor(private formBuilder: FormBuilder) { }

  onLoggedIn(result: OauthProviderData): void {
    this.form.patchValue(result);
    this.authenticated.emit(result);
  }
}
