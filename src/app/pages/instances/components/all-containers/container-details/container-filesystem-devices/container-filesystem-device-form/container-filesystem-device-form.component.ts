import {
  ChangeDetectionStrategy, Component, computed, OnInit, signal, inject,
} from '@angular/core';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { ContainerDeviceType } from 'app/enums/container.enum';
import { containersHelptext } from 'app/helptext/containers/containers';
import {
  ContainerFilesystemDevice,
  ContainerInstance,
} from 'app/interfaces/container.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  containerPathValidator,
  poolPathValidator,
} from 'app/pages/instances/utils/storage-device-validators';
import { FilesystemService } from 'app/services/filesystem.service';

interface InstanceFilesystemDeviceFormOptions {
  instance: ContainerInstance;
  disk: ContainerFilesystemDevice | undefined;
}

@UntilDestroy()
@Component({
  selector: 'ix-container-filesystem-device-form',
  styleUrls: ['./container-filesystem-device-form.component.scss'],
  templateUrl: './container-filesystem-device-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxExplorerComponent,
    IxInputComponent,
    ReactiveFormsModule,
    TranslateModule,
    MatCard,
    MatCardContent,
    ModalHeaderComponent,
    IxFieldsetComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
  ],
})
export class ContainerFilesystemDeviceFormComponent implements OnInit {
  private formBuilder = inject(FormBuilder);
  private errorHandler = inject(FormErrorHandlerService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private filesystem = inject(FilesystemService);
  slideInRef = inject<SlideInRef<InstanceFilesystemDeviceFormOptions, boolean>>(SlideInRef);

  private existingDisk = signal<ContainerFilesystemDevice | null>(null);

  protected readonly isLoading = signal(false);

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

  protected get instance(): ContainerInstance {
    return this.slideInRef.getData().instance;
  }

  constructor() {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
  }

  ngOnInit(): void {
    const disk = this.slideInRef.getData()?.disk;
    if (disk) {
      this.existingDisk.set(disk);
      this.form.patchValue({
        source: disk.source || '',
        target: disk.target || '',
      });
    }
  }

  protected onSubmit(): void {
    this.isLoading.set(true);
    this.prepareRequest()
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.snackbar.success(this.translate.instant('Filesystem Device was saved'));
          this.slideInRef.close({
            response: true,
          });
          this.isLoading.set(false);
        },
        error: (error: unknown) => {
          this.errorHandler.handleValidationErrors(error, this.form);
          this.isLoading.set(false);
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
        container: this.instance.id,
        attributes: payload,
      }]);
  }

  protected readonly containersHelptext = containersHelptext;
}
