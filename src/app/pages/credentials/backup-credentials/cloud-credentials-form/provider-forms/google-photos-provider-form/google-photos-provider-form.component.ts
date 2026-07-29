import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  selector: 'ix-google-photos-provider-form',
  templateUrl: './google-photos-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
  ],
})
export class GooglePhotosProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  protected readonly InputType = InputType;

  private formBuilder = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  form = this.formBuilder.group({
    token: ['', Validators.required],
    client_id: ['', Validators.required],
    client_secret: ['', Validators.required],
  });

  readonly oauthTooltip = helptext.googlePhotosToken.oauth_tooltip;
  readonly tokenTooltip = helptext.googlePhotosToken.tooltip;

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((values) => {
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
