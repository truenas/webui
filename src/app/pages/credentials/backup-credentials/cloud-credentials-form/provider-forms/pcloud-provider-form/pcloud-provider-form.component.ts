import {
  AfterViewInit,
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  selector: 'ix-pcloud-provider-form',
  templateUrl: './pcloud-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PcloudProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  @ViewChild(OauthProviderComponent, { static: true }) oauthComponent: OauthProviderComponent;

  form = this.formBuilder.group({
    token: ['', Validators.required],
    hostname: [''],
  });

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(untilDestroyed(this)).subscribe((values) => {
      this.form.patchValue(values);
      this.oauthComponent.form.patchValue(values);
    });
  }
  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }

  onOauthAuthenticated(attributes: Record<string, unknown>): void {
    this.form.patchValue(attributes);
  }

  override getSubmitAttributes(): OauthProviderComponent['form']['value'] & this['form']['value'] {
    return {
      ...this.oauthComponent?.form?.value,
      ...this.form.value,
    };
  }
}
