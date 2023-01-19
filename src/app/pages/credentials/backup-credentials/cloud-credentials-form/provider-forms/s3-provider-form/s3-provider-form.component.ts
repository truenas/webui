import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  templateUrl: './s3-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class S3ProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  form = this.formBuilder.group({
    access_key_id: ['', Validators.required],
    secret_access_key: ['', Validators.required],

    max_upload_parts: [null as number],
    endpoint: [''],
    region: [''],
    skip_region: [false],
    signatures_v2: [false],
  });
  private formPatcher$ = new BehaviorSubject<CloudCredential['attributes']>({});

  getFormSetter$ = (): BehaviorSubject<CloudCredential['attributes']> => {
    return this.formPatcher$;
  };

  ngAfterViewInit(): void {
    this.formPatcher$.pipe(untilDestroyed(this)).subscribe((values) => {
      this.form.patchValue(values);
    });
  }
  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }
}
