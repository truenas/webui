import {
  AfterViewInit,
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  templateUrl: './google-photos-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GooglePhotosProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  private formPatcher$ = new BehaviorSubject<CloudCredential['attributes']>({});

  form = this.formBuilder.group({
    token: ['', Validators.required],
    client_id: ['', Validators.required],
    client_secret: ['', Validators.required],
  });

  readonly oauthTooltip = helptext.token_google_photos.oauth_tooltip;
  readonly tokenTooltip = helptext.token_google_photos.tooltip;

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(untilDestroyed(this)).subscribe((values) => {
      this.form.patchValue(values);
    });
  }

  getFormSetter$ = (): BehaviorSubject<CloudCredential['attributes']> => {
    return this.formPatcher$;
  };

  getSubmitAttributes(): this['form']['value'] {
    return {
      ...this.form.value,
    };
  }
}
