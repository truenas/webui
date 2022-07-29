import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { helptextSystemCloudcredentials as helptext } from 'app/helptext/system/cloud-credentials';
import { CloudsyncProvider } from 'app/interfaces/cloudsync-provider.interface';
import {
  BaseProviderFormComponent
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';
import { of } from 'rxjs';

@Component({
  templateUrl: './webdav-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WebdavProviderFormComponent extends BaseProviderFormComponent {
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

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
  ) {
    super();
  }
}
