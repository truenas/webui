import {
  ChangeDetectionStrategy, Component, signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Role } from 'app/enums/role.enum';
import { containersHelptext } from 'app/helptext/virtualization/containers';
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
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { ModalHeader2Component } from 'app/modules/slide-ins/components/modal-header2/modal-header2.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-edit-form',
  standalone: true,
  imports: [
    ModalHeader2Component,
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
  protected readonly isLoading = signal(false);
  protected readonly requiredRoles = [Role.VirtGlobalWrite];

  title: string;
  editingInstance: VirtualizationInstance;

  protected readonly form = this.formBuilder.nonNullable.group({
    autostart: [false],
    cpu: ['', [cpuValidator()]],
    memory: [null as number],
    environmentVariables: new FormArray<InstanceEnvVariablesFormGroup>([]),
  });

  constructor(
    private api: ApiService,
    private formBuilder: FormBuilder,
    private formErrorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    protected formatter: IxFormatterService,
    private slideInRef: ChainedRef<VirtualizationInstance>,
  ) {
    this.editingInstance = this.slideInRef.getData();
    this.title = this.translate.instant('Edit Instance: {name}', { name: this.editingInstance.name });
    this.form.patchValue({
      cpu: this.editingInstance.cpu,
      autostart: this.editingInstance.autostart,
      memory: this.editingInstance.memory,
    });

    Object.keys(this.editingInstance.environment || {}).forEach((key) => {
      this.addEnvironmentVariable(key, this.editingInstance.environment[key]);
    });
  }

  protected onSubmit(): void {
    const payload = this.getSubmissionPayload();
    const job$ = this.api.job('virt.instance.update', [this.editingInstance.id, payload]);

    this.dialogService.jobDialog(job$, {
      title: this.translate.instant('Updating Instance'),
    })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (response) => {
          this.snackbar.success(this.translate.instant('Instance updated'));
          this.slideInRef.close({ error: false, response: response.result });
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
    const values = this.form.value;

    return {
      environment: this.environmentVariablesPayload,
      autostart: values.autostart,
      cpu: values.cpu,
      memory: values.memory,
    } as UpdateVirtualizationInstance;
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

  protected readonly containersHelptext = containersHelptext;
}
