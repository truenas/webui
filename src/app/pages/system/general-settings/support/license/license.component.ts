import {
  ChangeDetectionStrategy,
  ChangeDetectorRef, Component,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { OldModalHeaderComponent } from 'app/modules/slide-ins/components/old-modal-header/old-modal-header.component';
import { OldSlideInRef } from 'app/modules/slide-ins/old-slide-in-ref';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-license',
  templateUrl: './license.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    OldModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxTextareaComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class LicenseComponent {
  protected readonly requiredRoles = [Role.FullAdmin];

  isFormLoading = false;

  title = helptext.update_license.license_placeholder;
  form = this.fb.group({
    license: ['', Validators.required],
  });

  license = {
    fcName: 'license',
    label: helptext.update_license.license_placeholder,
  };

  constructor(
    private fb: FormBuilder,
    private dialogService: DialogService,
    private slideInRef: OldSlideInRef<LicenseComponent>,
    protected api: ApiService,
    private cdr: ChangeDetectorRef,
    private errorHandler: FormErrorHandlerService,
  ) {}

  onSubmit(): void {
    this.isFormLoading = true;

    const { license } = this.form.value;
    this.api.call('system.license_update', [license]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.slideInRef.close(true);
        this.cdr.markForCheck();
        setTimeout(() => {
          this.dialogService.confirm({
            title: helptext.update_license.reload_dialog_title,
            message: helptext.update_license.reload_dialog_message,
            hideCheckbox: true,
            buttonText: helptext.update_license.reload_dialog_action,
            hideCancel: true,
            disableClose: true,
          }).pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
            document.location.reload();
          });
        }, 200);
      },
      error: (error: unknown) => {
        this.isFormLoading = false;
        this.errorHandler.handleValidationErrors(error, this.form);
        this.cdr.markForCheck();
      },
    });
  }
}
