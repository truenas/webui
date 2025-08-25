import { ChangeDetectionStrategy, Component, signal, inject } from '@angular/core';
import {
  FormArray, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import {
  VirtualizationStatus,
} from 'app/enums/virtualization.enum';
import { choicesToOptions } from 'app/helpers/operators/options.operators';
import { instancesHelptext } from 'app/helptext/instances/instances';
import {
  InstanceEnvVariablesFormGroup,
  UpdateVirtualizationInstance,
  VirtualizationInstance,
} from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxListItemComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list-item/ix-list-item.component';
import { IxListComponent } from 'app/modules/forms/ix-forms/components/ix-list/ix-list.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { cpuValidator } from 'app/modules/forms/ix-forms/validators/cpu-validation/cpu-validation';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-edit-form',
  imports: [
    ModalHeaderComponent,
    IxInputComponent,
    ReactiveFormsModule,
    TranslateModule,
    IxCheckboxComponent,
    MatButton,
    TestDirective,
    IxFieldsetComponent,
    IxListComponent,
    IxListItemComponent,
  ],
  templateUrl: './instance-edit-form.component.html',
  styleUrls: ['./instance-edit-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceEditFormComponent {
  private api = inject(ApiService);
  private formBuilder = inject(NonNullableFormBuilder);
  private formErrorHandler = inject(FormErrorHandlerService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private dialogService = inject(DialogService);
  protected formatter = inject(IxFormatterService);
  slideInRef = inject<SlideInRef<VirtualizationInstance, VirtualizationInstance | false>>(SlideInRef);

  protected readonly isLoading = signal(false);
  protected readonly requiredRoles = [Role.VirtGlobalWrite];

  title: string;
  editingInstance: VirtualizationInstance;
  poolOptions$ = this.api.call('virt.global.pool_choices').pipe(choicesToOptions());

  protected readonly instancesHelptext = instancesHelptext;


  get isStopped(): boolean {
    return this.editingInstance.status === VirtualizationStatus.Stopped;
  }

  protected readonly form = this.formBuilder.group({
    autostart: [false],
    cpu: ['', [cpuValidator()]],
    memory: [null as number | null],
    environmentVariables: new FormArray<InstanceEnvVariablesFormGroup>([]),
  });

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    this.editingInstance = this.slideInRef.getData();

    this.title = this.translate.instant('Edit Container: {name}', { name: this.editingInstance.name });
    this.form.patchValue({
      cpu: this.editingInstance.cpu,
      autostart: this.editingInstance.autostart,
      memory: this.editingInstance.memory,
    });

    this.setVncControls();

    Object.keys(this.editingInstance.environment || {}).forEach((key) => {
      this.addEnvironmentVariable(key, this.editingInstance.environment[key]);
    });
  }

  protected onSubmit(): void {
    const payload = this.getSubmissionPayload();
    const job$ = this.api.job('virt.instance.update', [this.editingInstance.id, payload]);

    this.dialogService.jobDialog(job$, {
      title: this.translate.instant('Updating Container'),
    })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.snackbar.success(this.translate.instant('Container updated'));
          this.slideInRef.close({ response: response.result });
        },
        error: (error: unknown) => {
          this.formErrorHandler.handleValidationErrors(error, this.form);
        },
      });
  }

  addEnvironmentVariable(name = '', value = ''): void {
    const control = this.formBuilder.group({
      name: [name, Validators.required],
      value: [value, Validators.required],
    });

    this.form.controls.environmentVariables.push(control);
  }

  removeEnvironmentVariable(index: number): void {
    this.form.controls.environmentVariables.removeAt(index);
  }

  private getSubmissionPayload(): UpdateVirtualizationInstance {
    const values = this.form.getRawValue();

    const payload = {
      autostart: values.autostart,
      cpu: values.cpu,
      memory: values.memory || null,
      environment: this.environmentVariablesPayload,
    } as UpdateVirtualizationInstance;

    return payload;
  }

  private get environmentVariablesPayload(): Record<string, string> {
    return this.form.controls.environmentVariables.controls.reduce((env: Record<string, string>, control) => {
      const name = control.get('name')?.value;
      const value = control.get('value')?.value;

      if (name && value) {
        env[name] = value;
      }
      return env;
    }, {});
  }

  private setVncControls(): void {
  }
}
