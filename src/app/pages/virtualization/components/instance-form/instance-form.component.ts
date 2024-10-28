import { ChangeDetectionStrategy, Component, computed, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { CreateVirtualizationInstance, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-instance-form',
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
  ],
  templateUrl: './instance-form.component.html',
  styleUrls: ['./instance-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InstanceFormComponent implements OnInit {
  protected readonly isLoading = signal(false);

  protected readonly isNew = computed(() => !this.existingInstance());

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    cpu: ['', Validators.required],
    autostart: [false],
    memory: [null as number, Validators.required],
    image: ['almalinux/8/cloud', Validators.required], // TODO: Temporary default.
  });

  protected readonly pageTitle = computed(() => {
    if (this.isLoading()) {
      return this.translate.instant('Loading...');
    }

    return this.isNew()
      ? this.translate.instant('Create Instance')
      : this.translate.instant('Update {name} Instance', { name: this.existingInstance().name });
  });

  private readonly existingInstance = signal<VirtualizationInstance | null>(null);

  constructor(
    private ws: WebSocketService,
    private formBuilder: FormBuilder,
    private matDialog: MatDialog,
    private route: ActivatedRoute,
    private router: Router,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogService: DialogService,
    protected formatter: IxFormatterService,
  ) {}

  ngOnInit(): void {
    const instanceId = this.route.snapshot.params['id'] as string;

    if (instanceId) {
      this.loadInstance(instanceId);
    }
  }

  protected onBrowseImages(): void {

  }

  protected onSubmit(): void {
    const values = this.form.value;

    const request$ = this.isNew()
      ? this.ws.job('virt.instance.create', [values as CreateVirtualizationInstance])
      : this.ws.job('virt.instance.update', [this.existingInstance().id, values]);

    this.dialogService.jobDialog(request$, {
      title: this.translate.instant('Saving Instance'),
    })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (newInstance) => {
          this.snackbar.success(this.translate.instant('Instance saved'));
          this.router.navigate(['/virtualization/instance', newInstance.id]);
        },
        error: (error) => {
          this.formErrorHandler.handleWsFormError(error, this.form);
        },
      });
  }

  private loadInstance(instanceId: string): void {
    this.isLoading.set(true);
    this.ws.call('virt.instance.query', [[['id', '=', instanceId]]])
      .pipe(
        map((instances) => {
          if (!instances.length) {
            throw new Error('Virtualization instance not found.');
          }

          return instances[0];
        }),
        finalize(() => this.isLoading.set(false)),
        untilDestroyed(this),
      )
      .subscribe({
        next: (instance) => {
          this.existingInstance.set(instance);
          this.setFormValues(instance);
          this.markFieldsAsDisabledOnEdit();
        },
        error: (error) => {
          this.errorHandler.showErrorModal(error);
          this.router.navigate(['/virtualization']);
        },
      });
  }

  private setFormValues(instance: VirtualizationInstance): void {
    this.form.setValue({
      name: instance.name,
      cpu: instance.cpu,
      autostart: instance.autostart,
      memory: instance.memory,
      image: '', // TODO:
    });
  }

  private markFieldsAsDisabledOnEdit(): void {
    // TODO: Why can't name be edited?
    const readonlyFields = ['name'] as const;

    readonlyFields.forEach((field) => {
      this.form.controls[field].disable();
    });
  }
}
