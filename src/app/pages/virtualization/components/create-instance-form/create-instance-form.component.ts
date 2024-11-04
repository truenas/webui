import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  FormBuilder, FormControl, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { VirtualizationRemote } from 'app/enums/virtualization.enum';
import {
  CreateVirtualizationInstance,
} from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { cpuValidator } from 'app/modules/forms/ix-forms/validators/cpu-validation/cpu-validation';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  SelectImageDialogComponent, VirtualizationImageWithId,
} from 'app/pages/virtualization/components/create-instance-form/select-image-dialog/select-image-dialog.component';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-create-instance-form',
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
  templateUrl: './create-instance-form.component.html',
  styleUrls: ['./create-instance-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateInstanceFormComponent {
  protected readonly isLoading = signal(false);

  protected readonly form = this.formBuilder.nonNullable.group({
    name: ['', Validators.required],
    cpu: ['', [Validators.required, cpuValidator()]],
    autostart: [false],
    memory: [null as number, Validators.required],
    image: ['', Validators.required],
  });

  protected readonly visibleImageName = new FormControl('');

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
  ) {}

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
    const values = this.form.value;

    const job$ = this.ws.job('virt.instance.create', [values as CreateVirtualizationInstance]);

    this.dialogService.jobDialog(job$, {
      title: this.translate.instant('Saving Instance'),
    })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe({
        next: (newInstance) => {
          this.snackbar.success(this.translate.instant('Instance saved'));
          this.router.navigate(['/virtualization/view', newInstance.id]);
        },
        error: (error) => {
          this.formErrorHandler.handleWsFormError(error, this.form);
        },
      });
  }
}
