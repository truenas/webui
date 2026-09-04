import {
  ChangeDetectionStrategy, Component, OnInit, computed, inject, input,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnFileInputComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent, TnTestIdDirective,
} from '@truenas/ui-components';
import { Observable, map, switchMap } from 'rxjs';
import { KiB } from 'app/constants/bytes.constant';
import { Role } from 'app/enums/role.enum';
import { helptextKerberosKeytabs } from 'app/helptext/directory-service/kerberos-keytabs-form-list';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { IxFormHostForm } from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { FileValidatorService } from 'app/modules/forms/ix-forms/validators/file-validator/file-validator.service';
import { ApiService } from 'app/modules/websocket/api.service';

/**
 * `FileReader` rather than `File.arrayBuffer()`: the latter is absent from jsdom, and the read has
 * to be an observable anyway so `<ix-form>` can run it as the submit request.
 */
function readFileAsArrayBuffer(file: File): Observable<ArrayBuffer> {
  return new Observable<ArrayBuffer>((subscriber) => {
    const reader = new FileReader();
    reader.onload = () => {
      subscriber.next(reader.result as ArrayBuffer);
      subscriber.complete();
    };
    reader.onerror = () => subscriber.error(reader.error);
    reader.readAsArrayBuffer(file);
    return () => reader.abort();
  });
}

@Component({
  selector: 'ix-kereberos-keytabs-form',
  templateUrl: './kerberos-keytabs-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxFormComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TnFileInputComponent,
    TnTestIdDirective,
    TranslateModule,
  ],
})
export class KerberosKeytabsFormComponent extends IxFormHostForm implements OnInit {
  private formBuilder = inject(FormBuilder);
  private api = inject(ApiService);
  private fileValidator = inject(FileValidatorService);
  private translate = inject(TranslateService);

  readonly editingRow = input<KerberosKeytab | undefined>(undefined);

  readonly requiredRoles = [Role.DirectoryServiceWrite];

  protected readonly isEditMode = computed(() => Boolean(this.editingRow()));

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    // `tn-file-input` in single mode holds one `File`, where `ix-file-input` always held a `File[]`.
    file: [null as File | null, Validators.compose([
      Validators.required,
      this.fileValidator.maxSize(40 * KiB),
    ])],
  });

  protected readonly helptext = helptextKerberosKeytabs;

  ngOnInit(): void {
    const row = this.editingRow();
    if (row) {
      this.form.patchValue({ name: row.name });
    }
  }

  protected handleSubmit = (): SubmitResult => {
    const values = this.form.getRawValue();
    const editingKeytab = this.editingRow();

    const request$ = readFileAsArrayBuffer(values.file).pipe(
      map((arrayBuffer) => {
        const bytes = new Uint8Array(arrayBuffer);
        const binaryString = Array.from(bytes).map((byte) => String.fromCharCode(byte)).join('');
        return { name: values.name, file: btoa(binaryString) };
      }),
      switchMap((payload) => {
        return editingKeytab
          ? this.api.call('kerberos.keytab.update', [editingKeytab.id, payload])
          : this.api.call('kerberos.keytab.create', [payload]);
      }),
    );

    return {
      request$,
      successMessage: editingKeytab
        ? this.translate.instant('Kerberos keytab updated')
        : this.translate.instant('Kerberos keytab added'),
    };
  };
}
