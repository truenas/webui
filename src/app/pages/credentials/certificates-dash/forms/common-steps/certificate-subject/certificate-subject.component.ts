import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { choicesToOptions } from 'app/helpers/options.helper';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { SystemGeneralService } from 'app/services';

@Component({
  selector: 'ix-certificate-subject',
  templateUrl: './certificate-subject.component.html',
  styleUrls: ['./certificate-subject.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateSubjectComponent {
  form = this.formBuilder.group({
    country: ['US', Validators.required],
    state: ['', Validators.required],
    city: ['', Validators.required],
    organization: ['', Validators.required],
    organizational_unit: [''],
    email: ['', [Validators.required, Validators.email]],
    common: [''],
    san: [[] as string[], Validators.required],
  });

  readonly helptext = helptextSystemCertificates;

  readonly countries$ = this.systemGeneralService.getCertificateCountryChoices()
    .pipe(choicesToOptions());

  constructor(
    private formBuilder: FormBuilder,
    private systemGeneralService: SystemGeneralService,
  ) { }
}
