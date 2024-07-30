import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  selector: 'ix-storj-provider-form',
  templateUrl: './storj-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StorjProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  form = this.formBuilder.group({
    access_key_id: ['', Validators.required],
    secret_access_key: ['', Validators.required],
  });

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(untilDestroyed(this)).subscribe((values) => {
      this.form.patchValue(values);
      this.cdr.detectChanges();
    });
  }
  constructor(
    private formBuilder: FormBuilder,
    private cdr: ChangeDetectorRef,
  ) {
    super();
  }
}
