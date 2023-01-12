import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { helptextSystemCertificates } from 'app/helptext/system/certificates';
import { Certificate } from 'app/interfaces/certificate.interface';
import { Option } from 'app/interfaces/option.interface';
import { SummaryProvider, SummarySection } from 'app/modules/common/summary/summary.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'ix-certificate-csr-exists',
  templateUrl: './certificate-csr-exists.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CertificateCsrExistsComponent implements OnInit, SummaryProvider {
  form = this.formBuilder.group({
    csrExistsOnSystem: [false],
    csr: [null as number],
  });

  csrs: Certificate[] = [];
  csrOptions$: Observable<Option[]> = of([]);

  readonly helptext = helptextSystemCertificates;

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private dialogService: DialogService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  ngOnInit(): void {
    this.loadCsrs();
  }

  getSummary(): SummarySection {
    if (!this.form.value.csrExistsOnSystem) {
      return [];
    }

    const selectedCsr = this.csrs.find((csr) => csr.id === this.form.value.csr);

    return [
      {
        label: this.translate.instant('CSR exists on this system'),
        value: this.translate.instant('Yes, {csr}', { csr: selectedCsr.name }),
      },
    ];
  }

  private loadCsrs(): void {
    this.ws.call('certificate.query', [[['CSR', '!=', null]]])
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (csrs) => {
          this.csrs = csrs;
          this.csrOptions$ = of(
            csrs.map((csr) => ({
              label: csr.name,
              value: csr.id,
            })),
          );
          this.cdr.markForCheck();
        },
        error: (error) => {
          new EntityUtils().handleWsError(this, error, this.dialogService);
        },
      });
  }
}
