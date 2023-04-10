import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, of } from 'rxjs';
import { CloudCredential } from 'app/interfaces/cloud-sync-task.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@UntilDestroy()
@Component({
  templateUrl: './webdav-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WebdavProviderFormComponent extends BaseProviderFormComponent implements AfterViewInit {
  form = this.formBuilder.group({
    url: ['', Validators.required],
    vendor: ['NEXTCLOUD'],
    user: ['', Validators.required],
    pass: ['', Validators.required],
  });

  vendors$ = of([
    {
      label: 'NEXTCLOUD',
      value: 'NEXTCLOUD',
    },
    {
      label: 'OWNCLOUD',
      value: 'OWNCLOUD',
    },
    {
      label: 'SHAREPOINT',
      value: 'SHAREPOINT',
    },
    {
      label: this.translate.instant('OTHER'),
      value: 'OTHER',
    },
  ]);
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
    private translate: TranslateService,
    public formatter: IxFormatterService,
  ) {
    super();
  }
}
