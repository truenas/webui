import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import helptext from 'app/helptext/directory-service/kerberos-keytabs-form-list';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './kerberos-keytabs-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KerberosKeytabsFormComponent implements OnInit {
  get isNew(): boolean {
    return !this.editingKerberosKeytab;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant(helptext.title_add)
      : this.translate.instant(helptext.title_edit);
  }

  form = this.formBuilder.group({
    name: ['', Validators.required],
    file: [null as File[], Validators.required],
  });

  isLoading = false;

  readonly helptext = helptext;

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private ws: WebSocketService,
    private slideInRef: IxSlideInRef<KerberosKeytabsFormComponent>,
    @Inject(SLIDE_IN_DATA) private editingKerberosKeytab: KerberosKeytab,
  ) {}

  ngOnInit(): void {
    if (this.editingKerberosKeytab) {
      this.setKerberosKeytabsForEdit();
    }
  }

  setKerberosKeytabsForEdit(): void {
    this.form.patchValue({
      name: this.editingKerberosKeytab.name,
    });
  }

  onSubmit(): void {
    const values = this.form.value;

    const fReader: FileReader = new FileReader();
    if (values.file.length) {
      fReader.readAsBinaryString(values.file[0]);
    }

    fReader.onloadend = () => {
      const file = btoa(fReader.result as string);
      const payload = {
        name: values.name,
        file,
      };
      this.isLoading = true;
      let request$: Observable<unknown>;
      if (this.isNew) {
        request$ = this.ws.call('kerberos.keytab.create', [payload]);
      } else {
        request$ = this.ws.call('kerberos.keytab.update', [
          this.editingKerberosKeytab.id,
          payload,
        ]);
      }

      request$.pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.isLoading = false;
          this.slideInRef.close();
        },
        error: (error) => {
          this.isLoading = false;
          this.errorHandler.handleWsFormError(error, this.form);
          this.cdr.markForCheck();
        },
      });
    };
  }
}
