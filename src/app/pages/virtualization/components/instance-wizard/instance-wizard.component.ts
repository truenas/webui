import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import {
  FormBuilder, FormControl, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { VirtualizationRemote } from 'app/enums/virtualization.enum';
import { Job } from 'app/interfaces/job.interface';
import {
  CreateVirtualizationInstance,
  UpdateVirtualizationInstance,
  VirtualizationInstance,
} from 'app/interfaces/virtualization.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { cpuValidator } from 'app/modules/forms/ix-forms/validators/cpu-validation/cpu-validation';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  SelectImageDialogComponent, VirtualizationImageWithId,
} from 'app/pages/virtualization/components/instance-wizard/select-image-dialog/select-image-dialog.component';
import { AuthService } from 'app/services/auth/auth.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-wizard',
  standalone: true,
  imports: [
    PageHeaderComponent,
    IxInputComponent,
    ReactiveFormsModule,
    TranslateModule,
    IxCheckboxComponent,
    MatButton,
    RequiresRolesDirective,
    TestDirective,
    IxFieldsetComponent,
    ReadOnlyComponent,
    AsyncPipe,
  ],
  templateUrl: './instance-wizard.component.html',
  styleUrls: ['./instance-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceWizardComponent implements OnInit {
  protected readonly isLoading = signal(false);
  protected readonly requiredRoles = [Role.VirtGlobalWrite];

  isNew = true;
  editingInstanceId: string = this.activatedRoute.snapshot.params.id as string;
  instanceName = '';

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    cpu: ['', [Validators.required, cpuValidator()]],
    autostart: [false],
    memory: [null as number, Validators.required],
    image: ['', Validators.required],
  });

  protected readonly visibleImageName = new FormControl('');

  get hasRequiredRoles(): Observable<boolean> {
    return this.authService.hasRole(this.requiredRoles);
  }

  get pageTitle(): string {
    return this.isNew
      ? this.translate.instant('Create Instance')
      : this.translate.instant('Edit Instance: {name}', { name: this.instanceName });
  }

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private matDialog: MatDialog,
    private router: Router,
    private formErrorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    protected formatter: IxFormatterService,
    private authService: AuthService,
    private errorHandler: ErrorHandlerService,
    private activatedRoute: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.checkForEditMode();
  }

  protected onBrowseImages(): void {
    this.matDialog
      .open(SelectImageDialogComponent, {
        minWidth: '80vw',
        data: {
          remote: VirtualizationRemote.LinuxContainers,
        },
      })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe((image: VirtualizationImageWithId) => {
        if (!image) {
          return;
        }

        this.form.controls.image.setValue(image.id);
        this.visibleImageName.setValue(image.label);
      });
  }

  protected onSubmit(): void {
    const payload = this.getSubmissionPayload();

    let job$: Observable<Job<VirtualizationInstance>>;

    if (!this.isNew) {
      job$ = this.ws.job('virt.instance.update', [this.editingInstanceId, payload as UpdateVirtualizationInstance]);
    } else {
      job$ = this.ws.job('virt.instance.create', [payload as CreateVirtualizationInstance]);
    }

    this.dialogService.jobDialog(job$, {
      title: this.translate.instant('Saving Instance'),
    })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: ({ result }) => {
          this.snackbar.success(this.translate.instant('Instance saved'));
          this.router.navigate(['/virtualization/view', result?.id]);
        },
        error: (error) => {
          this.formErrorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  private afterInstanceLoadError(error: unknown): void {
    this.router.navigate(['/virtualization']).then(() => {
      this.errorHandler.showErrorModal(error);
    });
  }

  private checkForEditMode(): void {
    if (this.editingInstanceId) {
      this.isNew = false;
      this.loadInstanceForEdit();
    }
  }

  private loadInstanceForEdit(): void {
    this.ws.call('virt.instance.get_instance', [this.editingInstanceId]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (instance) => {
        this.instanceName = instance.name;

        this.form.patchValue({
          cpu: instance.cpu,
          autostart: instance.autostart,
          memory: instance.memory,
        });

        this.form.controls.name.disable();
        this.form.controls.image.disable();
      },
      error: (error: WebSocketError) => this.afterInstanceLoadError(error),
    });
  }

  private getSubmissionPayload(): CreateVirtualizationInstance | UpdateVirtualizationInstance {
    const values = this.form.value;

    if (this.isNew) {
      return values as CreateVirtualizationInstance;
    }

    return {
      environment: null,
      autostart: values.autostart,
      cpu: values.cpu,
      memory: values.memory,
    } as UpdateVirtualizationInstance;
  }
}
