import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  InputType, TnCheckboxComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { DetailsItemComponent } from 'app/modules/details-table/details-item/details-item.component';
import { DetailsTableComponent } from 'app/modules/details-table/details-table.component';
import { EditableComponent } from 'app/modules/forms/editable/editable.component';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  selector: 'ix-s3-provider-form',
  styleUrls: ['./s3-provider-form.component.scss'],
  templateUrl: './s3-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnCheckboxComponent,
    DetailsTableComponent,
    DetailsItemComponent,
    EditableComponent,
    TranslateModule,
  ],
})
export class S3ProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  private formBuilder = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  protected readonly InputType = InputType;

  form = this.formBuilder.group({
    access_key_id: ['', Validators.required],
    secret_access_key: ['', Validators.required],

    max_upload_parts: [null as number | null],
    endpoint: [''],
    region: [''],
    skip_region: [false],
    signatures_v2: [false],
    sign_accept_encoding: [true],
  });

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((values) => {
      this.form.patchValue(values);
      this.cdr.detectChanges();
    });
  }
}
