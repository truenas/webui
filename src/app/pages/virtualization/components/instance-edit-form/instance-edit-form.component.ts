import {
  ChangeDetectionStrategy, Component, Inject, signal,
} from '@angular/core';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import {
  UpdateVirtualizationInstance,
  VirtualizationInstance,
} from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { cpuValidator } from 'app/modules/forms/ix-forms/validators/cpu-validation/cpu-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/services/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-edit-form',
  standalone: true,
  imports: [
    ModalHeaderComponent,
    IxInputComponent,
    ReactiveFormsModule,
    TranslateModule,
    IxCheckboxComponent,
    MatButton,
    TestDirective,
    IxFieldsetComponent,

  ],
  templateUrl: './instance-edit-form.component.html',
  styleUrls: ['./instance-edit-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceEditFormComponent {
  protected readonly isLoading = signal(false);
  protected readonly requiredRoles = [Role.VirtGlobalWrite];

  title = this.translate.instant('Edit Instance: {name}', { name: this.instance.name });
  editingInstanceId = this.instance.id;

  protected readonly form = this.formBuilder.nonNullable.group({
    cpu: ['', [Validators.required, cpuValidator()]],
    autostart: [false],
    memory: [null as number, Validators.required],
  });

  constructor(
    private ws: ApiService,
    private formBuilder: FormBuilder,
    private formErrorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    protected formatter: IxFormatterService,
    private slideInRef: SlideInRef<InstanceEditFormComponent>,
    @Inject(SLIDE_IN_DATA) private instance: VirtualizationInstance,
  ) {
    this.form.patchValue({
      cpu: instance.cpu,
      autostart: instance.autostart,
      memory: instance.memory,
    });
  }

  protected onSubmit(): void {
    const payload = this.getSubmissionPayload();

    const job$ = this.ws.job('virt.instance.update', [this.editingInstanceId, payload]);

    this.dialogService.jobDialog(job$, {
      title: this.translate.instant('Updating Instance'),
    })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.snackbar.success(this.translate.instant('Instance updated'));
          this.slideInRef.close(true);
        },
        error: (error) => {
          this.formErrorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  private getSubmissionPayload(): UpdateVirtualizationInstance {
    const values = this.form.value;

    return {
      environment: null,
      autostart: values.autostart,
      cpu: values.cpu,
      memory: values.memory,
    } as UpdateVirtualizationInstance;
  }
}
