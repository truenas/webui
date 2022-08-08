import { Component } from '@angular/core';
import { FormGroup } from '@angular/forms';

import { FieldConfig } from '../../models/field-config.interface';
import { Field } from '../../models/field.interface';

export type OauthJiraMessage = MessageEvent & {
  data: {
    error?: string;
    result?: string;
    data?: string;
  };
};

@Component({
  selector: 'form-oauth-login',
  templateUrl: './form-oauth-login.component.html',
  styleUrls: ['./form-oauth-login.component.scss'],
})
export class FormOauthLoginComponent implements Field {
  config: FieldConfig;
  group: FormGroup;
  fieldShow: string;

  get hasValue(): boolean {
    return Boolean(this.group.controls[this.config.name].value);
  }

  initSession(): void {
    const authFn = (message: OauthJiraMessage): void => this.doAuth(message);

    window.removeEventListener('message', authFn, false);
    window.open('https://support-proxy.ixsystems.com/oauth/initiate?origin=' + encodeURIComponent(window.location.toString()), '_blank', 'width=640,height=480');
    window.addEventListener('message', authFn, false);
  }

  doAuth(message: OauthJiraMessage): void {
    const token = message.data as string;
    this.group.controls[this.config.name].setValue(token);
  }
}
