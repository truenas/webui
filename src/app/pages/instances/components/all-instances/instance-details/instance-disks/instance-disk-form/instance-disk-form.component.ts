import {
  ChangeDetectionStrategy, Component, computed, OnInit, signal,
} from '@angular/core';
import {
  FormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, Observable, of } from 'rxjs';
import {
  DiskIoBus,
  diskIoBusLabels,
  VirtualizationDeviceType,
  VirtualizationType,
} from 'app/enums/virtualization.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { instancesHelptext } from 'app/helptext/instances/instances';
import {
  VirtualizationDisk,
  VirtualizationInstance,
  VirtualizationVolume,
} from 'app/interfaces/virtualization.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  VolumesDialogComponent,
  VolumesDialogOptions,
} from 'app/pages/instances/components/common/volumes-dialog/volumes-dialog.component';
import { FilesystemService } from 'app/services/filesystem.service';

interface InstanceDiskFormOptions {
  instance: VirtualizationInstance;
  disk: VirtualizationDisk | undefined;
}

@UntilDestroy()
@Component({
  selector: 'ix-instance-disk-form',
  styleUrls: ['./instance-disk-form.component.scss'],
  templateUrl: './instance-disk-form.component.html',
  standalone: true,
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
    IxSelectComponent,
    TestDirective,
  ],
})
export class InstanceDiskFormComponent implements OnInit {
  private existingDisk = signal<VirtualizationDisk | null>(null);

  protected readonly diskIoBusOptions$ = of(mapToOptions(diskIoBusLabels, this.translate));
  protected readonly isLoading = signal(false);

  readonly datasetProvider = this.filesystem.getFilesystemNodeProvider({ datasetsOnly: true });

  protected form = this.formBuilder.nonNullable.group({
    source: ['', Validators.required],
    destination: ['', Validators.required],
    io_bus: [DiskIoBus.Nvme, Validators.required],
    boot_priority: [1],
  });

  protected isNew = computed(() => !this.existingDisk());

  protected title = computed(() => {
    return !this.isNew() ? this.translate.instant('Edit Disk') : this.translate.instant('Add Disk');
  });

  protected get instance(): VirtualizationInstance {
    return this.slideInRef.getData().instance;
  }

  protected get isVm(): boolean {
    return this.instance.type === VirtualizationType.Vm;
  }

  constructor(
    private formBuilder: FormBuilder,
    private errorHandler: FormErrorHandlerService,
    private api: ApiService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private matDialog: MatDialog,
    private filesystem: FilesystemService,
    public slideInRef: SlideInRef<InstanceDiskFormOptions, boolean>,
  ) {
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
        destination: disk.destination || '',
        io_bus: disk.io_bus || null,
        boot_priority: disk.boot_priority || undefined,
      });
    }

    if (this.isVm) {
      this.form.controls.destination.disable();
    } else {
      this.form.controls.boot_priority.disable();
      this.form.controls.io_bus.disable();
    }
  }

  protected onSelectVolume(): void {
    this.matDialog
      .open<VolumesDialogComponent, VolumesDialogOptions, VirtualizationVolume>(VolumesDialogComponent, {
        minWidth: '90vw',
        data: {
          selectionMode: true,
        },
      })
      .afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((volume) => {
        this.form.patchValue({ source: volume.id });
      });
  }

  protected onSubmit(): void {
    this.isLoading.set(true);
    this.prepareRequest()
      .pipe(untilDestroyed(this))
      .subscribe({
        complete: () => {
          this.snackbar.success(this.translate.instant('Disk saved'));
          this.slideInRef.close({
            error: false,
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
    const payload = {
      ...this.form.value,
      dev_type: VirtualizationDeviceType.Disk,
    } as VirtualizationDisk;

    const existingDisk = this.existingDisk();
    return existingDisk
      ? this.api.call('virt.instance.device_update', [this.instance.id, {
        ...payload,
        name: existingDisk.name,
      }])
      : this.api.call('virt.instance.device_add', [this.instance.id, payload]);
  }

  protected readonly instancesHelptext = instancesHelptext;
}
