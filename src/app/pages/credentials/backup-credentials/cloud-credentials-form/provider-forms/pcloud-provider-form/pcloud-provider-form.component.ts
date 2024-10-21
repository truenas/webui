import {
  AfterViewInit,
  ChangeDetectionStrategy, Component, ViewChild,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
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
  selector: 'ix-pcloud-provider-form',
  templateUrl: './pcloud-provider-form.component.html',
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
