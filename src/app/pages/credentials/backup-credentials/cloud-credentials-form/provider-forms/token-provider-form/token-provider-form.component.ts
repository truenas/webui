import {
  AfterViewInit, ChangeDetectionStrategy, Component, ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { CloudsyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  templateUrl: './token-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TokenProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  @ViewChild(OauthProviderComponent, { static: false }) oauthComponent: OauthProviderComponent;
  private formPatcher$ = new BehaviorSubject<CloudCredential['attributes']>({});

  form = this.formBuilder.group({
    token: ['', Validators.required],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }

  get hasOAuth(): boolean {
    return Boolean(this.provider.credentials_oauth);
  }

  get tooltip(): string {
    switch (this.provider.name) {
      case CloudsyncProviderName.Box:
        return helptext.token_box.tooltip;
      case CloudsyncProviderName.Dropbox:
        return helptext.token_dropbox.tooltip;
      case CloudsyncProviderName.GooglePhotos:
        return helptext.token_google_photos.tooltip;
      case CloudsyncProviderName.Hubic:
        return helptext.token_hubic.tooltip;
      case CloudsyncProviderName.Yandex:
        return helptext.token_yandex.tooltip;
      default:
        return '';
    }
  }

  getFormSetter$ = (): BehaviorSubject<CloudCredential['attributes']> => {
    return this.formPatcher$;
  };

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(untilDestroyed(this)).subscribe((values) => {
      this.form.patchValue(values);
      if (this.hasOAuth) {
        this.oauthComponent.form.patchValue(values);
      }
    });
  }

  onOauthAuthenticated(attributes: Record<string, unknown>): void {
    this.form.patchValue(attributes);
  }

  getSubmitAttributes(): OauthProviderComponent['form']['value'] & this['form']['value'] {
    if (!this.hasOAuth) {
      return this.form.value;
    }

    return {
      ...this.oauthComponent.form.value,
      ...this.form.value,
    };
  }
}
