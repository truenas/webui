import {
  ChangeDetectionStrategy, Component, Inject,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { map, Observable, of } from 'rxjs';
import { instancesHelptext } from 'app/helptext/instances/instances';
import { Option } from 'app/interfaces/option.interface';
import { VirtualizationDisk, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-change-boot-from-disk',
  templateUrl: './change-boot-from-disk.component.html',
  styleUrls: ['./change-boot-from-disk.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatDialogClose,
    MatDialogTitle,
    ReactiveFormsModule,
    TestDirective,
    TranslateModule,
    IxSelectComponent,
    FormActionsComponent,
  ],
})
export class ChangeBootFromDiskComponent {
  protected readonly form = this.formBuilder.group({
    boot_from: [null as string | null, [Validators.required]],
  });

  readonly bootFromOptions$: Observable<Option[]> = of(this.data.visibleDisks).pipe(
    map((disks) => {
      return disks.map((disk) => ({
        label: disk.source,
        value: disk.name,
      }));
    }),
  );

  protected readonly instancesHelptext = instancesHelptext;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: {
      instance: VirtualizationInstance;
      primaryBootDisk: VirtualizationDisk;
      visibleDisks: VirtualizationDisk[];
    },
    private formBuilder: NonNullableFormBuilder,
    private errorHandler: ErrorHandlerService,
    private loader: LoaderService,
    private api: ApiService,
    private translate: TranslateService,
    private snackbar: SnackbarService,
    private dialogRef: MatDialogRef<ChangeBootFromDiskComponent>,
    protected formatter: IxFormatterService,
  ) {
    if (this.data.primaryBootDisk?.source) {
      this.form.setValue({
        boot_from: this.data.primaryBootDisk.name,
      });
    } else {
      this.form.setValue({
        boot_from: this.data.visibleDisks[0].name,
      });
    }
  }

  onSubmit(): void {
    const bootDiskName = this.form.value.boot_from;
    const bootDiskSource = this.data.visibleDisks.find((disk) => disk.name === bootDiskName).source;

    this.api.call('virt.instance.set_bootable_disk', [this.data.instance.id, bootDiskName])
      .pipe(
        this.loader.withLoader(),
        untilDestroyed(this),
      ).subscribe({
        next: () => {
          this.dialogRef.close(bootDiskName);
          this.snackbar.success(
            this.translate.instant('"{source}" is selected as the primary boot disk.', { source: bootDiskSource }),
          );
        },
        error: (error: unknown) => {
          this.errorHandler.showErrorModal(error);
        },
      });
  }
}
