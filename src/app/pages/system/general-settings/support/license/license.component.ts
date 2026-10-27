import {
  ChangeDetectionStrategy, Component, inject, output, viewChild,
} from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnFormFieldComponent, TnFormSectionComponent, TnInputComponent } from '@truenas/ui-components';
import { Role } from 'app/enums/role.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  FormSubmitEvent,
  IxFormComponent,
  SubmitResult,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ApiService } from 'app/modules/websocket/api.service';

@Component({
  selector: 'ix-license',
  templateUrl: './license.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFormComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnInputComponent,
    TranslateModule,
  ],
})
export class LicenseComponent {
  private fb = inject(FormBuilder);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private window = inject<Window>(WINDOW);

  readonly closed = output<boolean>();

  private readonly ixForm = viewChild(IxFormComponent);

  readonly requiredRoles = [Role.FullAdmin];

  protected form = this.fb.nonNullable.group({
    license: ['', Validators.required],
  });

  protected readonly license = {
    fcName: 'license',
    label: helptext.updateLicense.licensePlaceholder,
  };

  canSubmit(): boolean {
    return this.ixForm()?.canSubmit() ?? false;
  }

  submit(): void {
    this.ixForm()?.submit();
  }

  hasUnsavedChanges(): boolean {
    return this.ixForm()?.hasUnsavedChanges() ?? false;
  }

  protected handleSubmit = (event: FormSubmitEvent<{ license: string }>): SubmitResult => ({
    request$: this.api.call('truenas.license.upload', [event.allValues.license]),
    successMessage: this.translate.instant('License uploaded.'),
    onSuccess: () => {
      this.dialogService.confirm({
        title: this.translate.instant(helptext.updateLicense.reloadDialogTitle),
        message: this.translate.instant(helptext.updateLicense.reloadDialogMessage),
        hideCheckbox: true,
        buttonText: this.translate.instant(helptext.updateLicense.reloadDialogAction),
        hideCancel: true,
        disableClose: true,
      }).subscribe(() => {
        this.window.location.reload();
      });
    },
  });
}
