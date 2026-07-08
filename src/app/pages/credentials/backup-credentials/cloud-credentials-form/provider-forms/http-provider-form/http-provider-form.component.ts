import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { SomeProviderAttributes } from 'app/interfaces/cloudsync-credential.interface';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  selector: 'ix-http-provider-form',
  templateUrl: './http-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
  ],
})
export class HttpProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  formatter = inject(IxFormatterService);
  private formBuilder = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  form = this.formBuilder.group({
    url: ['', Validators.required],
  });

  override getSubmitAttributes(): SomeProviderAttributes {
    const attributes = super.getSubmitAttributes();
    return {
      ...attributes,
      url: this.formatter.stringAsUrlParsing(this.form.controls.url.value ?? ''),
    };
  }

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((values) => {
      this.form.patchValue(values);
      this.cdr.detectChanges();
    });
  }
}
