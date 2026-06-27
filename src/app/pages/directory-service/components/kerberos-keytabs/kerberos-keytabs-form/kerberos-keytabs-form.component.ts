import {
  ChangeDetectionStrategy, Component, DestroyRef, input, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnFormFieldComponent, TnFormSectionComponent, TnInputComponent } from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { KiB } from 'app/constants/bytes.constant';
import { Role } from 'app/enums/role.enum';
import { helptextKerberosKeytabs } from 'app/helptext/directory-service/kerberos-keytabs-form-list';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { FileValidatorService } from 'app/modules/forms/ix-forms/validators/file-validator/file-validator.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-kereberos-keytabs-form',
  templateUrl: './kerberos-keytabs-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    IxFileInputComponent,
    TranslateModule,
  ],
})
export class KerberosKeytabsFormComponent extends SidePanelForm implements OnInit {
  private formBuilder = inject(FormBuilder);
  private errorHandler = inject(FormErrorHandlerService);
  private api = inject(ApiService);
  private fileValidator = inject(FileValidatorService);
  private destroyRef = inject(DestroyRef);

  readonly editingRow = input<KerberosKeytab | undefined>(undefined);

  readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected editingKerberosKeytab: KerberosKeytab | undefined;

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    file: [null as File[] | null, Validators.compose([
      Validators.required,
      this.fileValidator.maxSize(40 * KiB),
    ])],
  });

  protected readonly isFormLoading = signal(false);

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  readonly helptext = helptextKerberosKeytabs;

  ngOnInit(): void {
    const row = (this.slideInRef?.getData() as KerberosKeytab | undefined) ?? this.editingRow();
    this.editingKerberosKeytab = row;

    if (row) {
      this.form.patchValue({
        name: row.name,
      });
    }
  }

  protected onSubmit(): void {
    const values = this.form.getRawValue();

    const fReader: FileReader = new FileReader();
    if (values.file?.length) {
      fReader.readAsArrayBuffer(values.file[0]);
    }

    fReader.onloadend = () => {
      const arrayBuffer = fReader.result as ArrayBuffer;
      const bytes = new Uint8Array(arrayBuffer);
      const binaryString = Array.from(bytes).map((byte) => String.fromCharCode(byte)).join('');
      const file = btoa(binaryString);
      const payload = {
        name: values.name,
        file,
      };
      this.isFormLoading.set(true);
      let request$: Observable<unknown>;
      if (this.editingKerberosKeytab) {
        request$ = this.api.call('kerberos.keytab.update', [
          this.editingKerberosKeytab.id,
          payload,
        ]);
      } else {
        request$ = this.api.call('kerberos.keytab.create', [payload]);
      }

      request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.isFormLoading.set(false);
          this.close(true);
        },
        error: (error: unknown) => {
          this.isFormLoading.set(false);
          this.errorHandler.handleValidationErrors(error, this.form);
        },
      });
    };
  }
}
