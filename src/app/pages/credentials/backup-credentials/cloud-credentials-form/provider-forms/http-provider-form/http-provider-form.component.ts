import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { BehaviorSubject } from 'rxjs';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  templateUrl: './http-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HttpProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  form = this.formBuilder.group({
    url: ['', Validators.required],
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
    public formatter: IxFormatterService,
  ) {
    super();
  }
}
