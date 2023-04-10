import {
  AfterViewInit,
  ChangeDetectionStrategy, Component, ViewChild,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import {
  OauthProviderComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/oauth-provider/oauth-provider.component';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  templateUrl: './pcloud-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PcloudProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  @ViewChild(OauthProviderComponent, { static: true }) oauthComponent: OauthProviderComponent;

  form = this.formBuilder.group({
    token: ['', Validators.required],
    hostname: [''],
  });
  private formPatcher$ = new BehaviorSubject<CloudCredential['attributes']>({});

  getFormSetter$ = (): BehaviorSubject<CloudCredential['attributes']> => {
    return this.formPatcher$;
  };

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(untilDestroyed(this)).subscribe((values) => {
      this.form.patchValue(values);
      this.oauthComponent.form.patchValue(values);
    });
  }
  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }

  onOauthAuthenticated(attributes: Record<string, unknown>): void {
    this.form.patchValue(attributes);
  }

  getSubmitAttributes(): OauthProviderComponent['form']['value'] & this['form']['value'] {
    return {
      ...this.oauthComponent.form.value,
      ...this.form.value,
    };
  }
}
