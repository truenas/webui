import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnFileInputComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnTestIdDirective,
} from '@truenas/ui-components';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { SomeProviderAttributes } from 'app/interfaces/cloudsync-credential.interface';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  selector: 'ix-google-cloud-provider-form',
  templateUrl: './google-cloud-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnFileInputComponent,
    TnInputComponent,
    TnTestIdDirective,
  ],
})
export class GoogleCloudProviderFormComponent extends BaseProviderFormComponent implements OnInit, AfterViewInit {
  private formBuilder = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  form = this.formBuilder.nonNullable.group({
    service_account_credentials: ['', Validators.required],
    upload_credentials: [null as File | null],
  });

  ngOnInit(): void {
    this.form.controls.upload_credentials.valueChanges.pipe(
      // `tn-file-input` is single-file here, so its value is one `File` (or null),
      // where `ix-file-input` always handed over a `File[]`.
      switchMap((file: File | null) => (file ? from(file.text()) : of(''))),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((credentials) => {
      this.form.controls.service_account_credentials.setValue(credentials);
    });
  }

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((values) => {
      this.form.patchValue(values);
      this.cdr.detectChanges();
    });
  }

  override getSubmitAttributes(): SomeProviderAttributes {
    return {
      service_account_credentials: this.form.getRawValue().service_account_credentials,
    };
  }
}
