import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { OauthButtonType } from 'app/modules/buttons/oauth-button/interfaces/oauth-button.interface';
import { OauthButtonComponent } from 'app/modules/buttons/oauth-button/oauth-button.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';

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
  standalone: true,
  imports: [
    IxFieldsetComponent,
    ReactiveFormsModule,
    OauthButtonComponent,
    IxInputComponent,
    TranslateModule,
  ],
})
export class OauthProviderComponent {
  readonly oauthUrl = input<string>();
  readonly authenticated = output<Record<string, unknown>>();

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

  onLoggedIn(result: unknown): void {
    this.form.patchValue(result as OauthProviderData);
    this.authenticated.emit(result as OauthProviderData);
  }
}
