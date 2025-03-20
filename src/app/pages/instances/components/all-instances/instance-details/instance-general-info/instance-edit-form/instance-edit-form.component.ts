import {
  ChangeDetectionStrategy, Component, signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
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
import { defaultVncPort } from 'app/pages/instances/instances.constants';

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
    IxListComponent,
    IxListItemComponent,
    MatTooltip,
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

  protected readonly containersHelptext = instancesHelptext;

  get isVm(): boolean {
    return this.editingInstance.type === VirtualizationType.Vm;
  }

  get isContainer(): boolean {
    return this.editingInstance.type === VirtualizationType.Container;
  }

  get isStopped(): boolean {
    return this.editingInstance.status === VirtualizationStatus.Stopped;
  }

  protected readonly form = this.formBuilder.nonNullable.group({
    autostart: [false],
    cpu: ['', [cpuValidator()]],
    memory: [null as number | null],
    enable_vnc: [false],
    vnc_port: [defaultVncPort, [Validators.min(5900), Validators.max(65535)]],
    vnc_password: [null as string],
    secure_boot: [false],
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
    public slideInRef: SlideInRef<VirtualizationInstance, VirtualizationInstance | false>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });

    this.editingInstance = this.slideInRef.getData();

    this.title = this.translate.instant('Edit Instance: {name}', { name: this.editingInstance.name });
    this.form.patchValue({
      cpu: this.editingInstance.cpu,
      autostart: this.editingInstance.autostart,
      memory: this.editingInstance.memory,
      enable_vnc: this.editingInstance.vnc_enabled,
      vnc_port: this.editingInstance.vnc_port,
      vnc_password: this.editingInstance.vnc_password,
      secure_boot: this.editingInstance.secure_boot,
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
    const control = this.formBuilder.nonNullable.group({
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

    let payload = {
      autostart: values.autostart,
      cpu: values.cpu,
      memory: values.memory || null,
      enable_vnc: values.enable_vnc,
      vnc_port: values.enable_vnc ? values.vnc_port || defaultVncPort : null,
      vnc_password: values.enable_vnc ? values.vnc_password : null,
      ...(this.isContainer ? { environment: this.environmentVariablesPayload } : null),
    } as UpdateVirtualizationInstance;

    if (payload.enable_vnc) {
      payload = {
        ...payload,
        vnc_port: values.enable_vnc ? values.vnc_port || defaultVncPort : null,
        vnc_password: values.enable_vnc ? values.vnc_password : null,
      };
    }

    if (this.isVm) {
      payload.secure_boot = values.secure_boot;
    }

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
    this.form.controls.enable_vnc.valueChanges.pipe(untilDestroyed(this)).subscribe((vncEnabled) => {
      if (vncEnabled) {
        this.form.controls.vnc_port.enable();
      } else {
        this.form.controls.vnc_port.disable();
      }
    });

    if (!this.isStopped) {
      this.form.controls.enable_vnc.disable();
      this.form.controls.vnc_password.disable();
      this.form.controls.vnc_port.disable();
    }
  }
}
