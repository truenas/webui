import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import {
  BaseProviderFormComponent,
} from 'app/pages/credentials/backup-credentials/cloud-credentials-form/provider-forms/base-provider-form';

@Component({
  templateUrl: './webdav-provider-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
