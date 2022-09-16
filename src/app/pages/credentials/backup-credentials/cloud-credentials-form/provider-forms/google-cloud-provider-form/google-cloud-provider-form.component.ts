import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { from, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  templateUrl: './google-cloud-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoogleCloudProviderFormComponent extends BaseProviderFormComponent implements OnInit {
  form = this.formBuilder.group({
    service_account_credentials: ['', Validators.required],
    upload_credentials: [[] as File[]],
  });

  constructor(
    private formBuilder: FormBuilder,
  ) {
    super();
  }

  ngOnInit(): void {
    this.form.controls['upload_credentials'].valueChanges.pipe(
      switchMap((files: File[]) => {
        if (!files.length) {
          return of('');
        }

        return from(files[0].text());
      }),
      untilDestroyed(this),
    ).subscribe((credentials) => {
      this.form.controls['service_account_credentials'].setValue(credentials);
    });
  }

  setValues(values: { service_account_credentials: string }): void {
    this.form.patchValue(values);
  }

  getSubmitAttributes(): CloudCredential['attributes'] {
    return {
      service_account_credentials: this.form.value.service_account_credentials,
    };
  }
}
