import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, viewChild,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  selector: 'ix-token-provider-form',
  templateUrl: './token-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    OauthProviderComponent,
    IxFieldsetComponent,
    ReactiveFormsModule,
    IxInputComponent,
    TranslateModule,
  ],
})
export class TokenProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  private readonly oauthComponent = viewChild(OauthProviderComponent);

  form = this.formBuilder.group({
    token: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }

  get hasOAuth(): boolean {
    return Boolean(this.provider.credentials_oauth);
  }

  get tooltip(): string {
    switch (this.provider.name) {
      case CloudSyncProviderName.Box:
        return helptext.token_box.tooltip;
      case CloudSyncProviderName.Dropbox:
        return helptext.token_dropbox.tooltip;
      case CloudSyncProviderName.Hubic:
        return helptext.token_hubic.tooltip;
      case CloudSyncProviderName.Yandex:
        return helptext.token_yandex.tooltip;
      default:
        return '';
    }
  }

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(untilDestroyed(this)).subscribe((values) => {
      this.form.patchValue(values);
      if (this.hasOAuth) {
        this.oauthComponent().form.patchValue(values);
      }
      this.cdr.detectChanges();
    });
  }

  onOauthAuthenticated(attributes: Record<string, unknown>): void {
    this.form.patchValue(attributes);
  }

  override getSubmitAttributes(): OauthProviderComponent['form']['value'] & this['form']['value'] {
    if (!this.hasOAuth) {
      return this.form.value;
    }

    return {
      ...this.oauthComponent()?.form?.value,
      ...this.form.value,
    };
  }
}
