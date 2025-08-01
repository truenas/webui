import { ChangeDetectionStrategy, Component, input, output, signal, inject } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { OauthButtonType } from 'app/modules/buttons/oauth-button/interfaces/oauth-button.interface';
import { OauthButtonComponent } from 'app/modules/buttons/oauth-button/oauth-button.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

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
  imports: [
    IxFieldsetComponent,
    ReactiveFormsModule,
    OauthButtonComponent,
    IxInputComponent,
    TranslateModule,
    TestDirective,
  ],
})
export class OauthProviderComponent {
  private formBuilder = inject(NonNullableFormBuilder);

  readonly oauthUrl = input<string>();
  readonly authenticated = output<Record<string, unknown>>();

  form = this.formBuilder.group({
    client_id: [''],
    client_secret: [''],
  });

  readonly helptext = helptext;
  readonly oauthType = OauthButtonType;
  readonly showManualConfig = signal(false);

  get hasOauthAuthorization(): boolean {
    return Boolean(this.form.value.client_id && this.form.value.client_secret);
  }

  onLoggedIn(result: unknown): void {
    this.form.patchValue(result as OauthProviderData);
    this.showManualConfig.set(false);
    this.authenticated.emit(result as OauthProviderData);
  }

  protected onShowManualConfig(): void {
    this.showManualConfig.set(true);
  }
}
