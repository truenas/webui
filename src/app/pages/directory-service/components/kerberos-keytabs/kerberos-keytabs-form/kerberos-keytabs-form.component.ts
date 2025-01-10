import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { KiB } from 'app/constants/bytes.constant';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextKerberosKeytabs } from 'app/helptext/directory-service/kerberos-keytabs-form-list';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { FileValidatorService } from 'app/modules/forms/ix-forms/validators/file-validator/file-validator.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-kereberos-keytabs-form',
  templateUrl: './kerberos-keytabs-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxInputComponent,
    IxFileInputComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class KerberosKeytabsFormComponent implements OnInit {
  protected readonly requiredRoles = [Role.DirectoryServiceWrite];
  protected editingKerberosKeytab: KerberosKeytab | undefined;

  get isNew(): boolean {
    return !this.editingKerberosKeytab;
  }

  get title(): string {
    return this.isNew
      ? this.translate.instant(helptextKerberosKeytabs.title_add)
      : this.translate.instant(helptextKerberosKeytabs.title_edit);
  }

  form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    file: [null as File[] | null, Validators.compose([
      Validators.required,
      this.fileValidator.maxSize(40 * KiB),
    ])],
  });

  isLoading = false;

  readonly helptext = helptextKerberosKeytabs;

  constructor(
    private translate: TranslateService,
    private formBuilder: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private api: ApiService,
    public slideInRef: SlideInRef<KerberosKeytab | undefined, boolean>,
    private fileValidator: FileValidatorService,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.editingKerberosKeytab = slideInRef.getData();
  }

  ngOnInit(): void {
    if (this.editingKerberosKeytab) {
      this.form.patchValue({
        name: this.editingKerberosKeytab.name,
      });
    }
  }

  onSubmit(): void {
    const values = this.form.getRawValue();

    const fReader: FileReader = new FileReader();
    if (values.file?.length) {
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
      if (this.editingKerberosKeytab) {
        request$ = this.api.call('kerberos.keytab.update', [
          this.editingKerberosKeytab.id,
          payload,
        ]);
      } else {
        request$ = this.api.call('kerberos.keytab.create', [payload]);
      }

      request$.pipe(untilDestroyed(this)).subscribe({
        next: () => {
          this.isLoading = false;
          this.slideInRef.close({ response: true, error: null });
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.errorHandler.handleValidationErrors(error, this.form);
          this.cdr.markForCheck();
        },
      });
    };
  }
}
