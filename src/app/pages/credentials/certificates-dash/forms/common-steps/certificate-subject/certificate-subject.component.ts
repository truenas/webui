import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { choicesToOptions } from 'app/helpers/options.helper';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { SystemGeneralService } from 'app/services';

@Component({
  selector: 'ix-certificate-subject',
  templateUrl: './certificate-subject.component.html',
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
