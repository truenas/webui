import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  selector: 'ix-google-photos-provider-form',
  templateUrl: './google-photos-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GooglePhotosProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  form = this.formBuilder.group({
    token: ['', Validators.required],
    client_id: ['', Validators.required],
    client_secret: ['', Validators.required],
  });

  readonly oauthTooltip = helptext.token_google_photos.oauth_tooltip;
  readonly tokenTooltip = helptext.token_google_photos.tooltip;

  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(untilDestroyed(this)).subscribe((values) => {
      this.form.patchValue(values);
      this.cdr.detectChanges();
    });
  }

  override getSubmitAttributes(): this['form']['value'] {
    return {
      ...this.form.value,
    };
  }
}
