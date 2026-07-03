import {
  ChangeDetectionStrategy, Component, computed, OnInit, signal, inject, DestroyRef, input,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnFormFieldComponent, TnFormSectionComponent, TnInputComponent,
} from '@truenas/ui-components';
import { Observable } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ContainerDeviceType } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { containersHelptext } from 'app/helptext/containers/containers';
import {
  Container,
  ContainerFilesystemDevice,
} from 'app/interfaces/container.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { ExplorerCreateDatasetComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  containerPathValidator,
  poolPathValidator,
} from 'app/pages/containers/utils/storage-device-validators';
import { FilesystemService } from 'app/services/filesystem.service';

interface ContainerFilesystemDeviceFormOptions {
  container: Container;
  disk: ContainerFilesystemDevice | undefined;
}

@Component({
  selector: 'ix-container-filesystem-device-form',
  styleUrls: ['./container-filesystem-device-form.component.scss'],
  templateUrl: './container-filesystem-device-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxExplorerComponent,
    ExplorerCreateDatasetComponent,
    TnInputComponent,
    ReactiveFormsModule,
    TranslateModule,
    ModalHeaderComponent,
    TnFormSectionComponent,
    TnFormFieldComponent,
    FormActionsComponent,
    TnButtonComponent,
    RequiresRolesDirective,
  ],
})
export class ContainerFilesystemDeviceFormComponent extends SidePanelForm implements OnInit {
  private destroyRef = inject(DestroyRef);
  private formBuilder = inject(FormBuilder);
  private errorHandler = inject(FormErrorHandlerService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private filesystem = inject(FilesystemService);

  /** Provided when hosted in `<tn-side-panel>`. Ignored when opened via legacy SlideIn. */
  readonly disk = input<ContainerFilesystemDevice | undefined>(undefined);
  readonly container = input<Container | undefined>(undefined);

  protected readonly requiredRoles = [Role.ContainerDeviceWrite];

  private existingDisk = signal<ContainerFilesystemDevice | null>(null);
  private targetContainer = signal<Container | undefined>(undefined);

  protected readonly isFormLoading = signal(false);

  readonly fileProvider = this.filesystem.getFilesystemNodeProvider();

  protected form = this.formBuilder.nonNullable.group({
    source: ['', [Validators.required, poolPathValidator()]],
    target: ['', [Validators.required, containerPathValidator()]],
  });

  protected isNew = computed(() => !this.existingDisk());

  protected title = computed(() => {
    return this.isNew()
      ? this.translate.instant('Add Filesystem Device')
      : this.translate.instant('Edit Filesystem Device');
  });

  readonly canSubmit = this.trackCanSubmit(this.isFormLoading);

  ngOnInit(): void {
    const data = this.slideInRef?.getData() as ContainerFilesystemDeviceFormOptions | undefined;
    const container = data?.container ?? this.container();
    const disk = data?.disk ?? this.disk();

    this.targetContainer.set(container);

    if (disk) {
      this.existingDisk.set(disk);
      this.form.patchValue({
        source: disk.source || '',
        target: disk.target || '',
      });
    }
  }

  protected onSubmit(): void {
    this.isFormLoading.set(true);
    this.prepareRequest()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        complete: () => {
          this.snackbar.success(this.translate.instant('Filesystem Device was saved'));
          this.isFormLoading.set(false);
          this.close(true);
        },
        error: (error: unknown) => {
          this.errorHandler.handleValidationErrors(error, this.form);
          this.isFormLoading.set(false);
        },
      });
  }

  private prepareRequest(): Observable<unknown> {
    const formValue = this.form.getRawValue();

    const payload: ContainerFilesystemDevice = {
      dtype: ContainerDeviceType.Filesystem,
      source: formValue.source,
      target: formValue.target,
    };

    const existingDisk = this.existingDisk();
    return existingDisk
      ? this.api.call('container.device.update', [existingDisk.id, {
          attributes: payload,
        }])
      : this.api.call('container.device.create', [{
          container: this.targetContainer().id,
          attributes: payload,
        }]);
  }

  protected readonly containersHelptext = containersHelptext;
}
