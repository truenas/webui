import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, input, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent,
  TnFormFieldComponent,
  TnFormSectionComponent,
  TnIconComponent,
  TnSelectComponent,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextDisks } from 'app/helptext/storage/disks/disks';
import { Disk, DiskUpdate } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { DiskFormResponse } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';

@Component({
  selector: 'ix-disk-bulk-edit',
  templateUrl: 'disk-bulk-edit.component.html',
  styleUrl: 'disk-bulk-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnIconComponent,
    TnSelectComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class DiskBulkEditComponent extends SidePanelForm<DiskFormResponse> implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private snackbarService = inject(SnackbarService);
  private errorHandler = inject(FormErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.DiskWrite];

  /**
   * Disks to edit when hosted in a `<tn-side-panel>` (which has no `SlideInRef` to
   * carry data). Unused in the legacy SlideIn host (which supplies them via
   * `slideInRef.getData()`).
   */
  readonly disksToEdit = input<Disk[]>([]);

  private diskIds: string[] = [];
  readonly isLoading = signal(false);
  protected readonly form = this.fb.group({
    disknames: [[] as string[]],
    hddstandby: [null as DiskStandby | null],
    advpowermgmt: [null as DiskPowerLevel | null],
  });

  protected readonly helptext = helptextDisks;
  protected readonly helptextBulkEdit = helptextDisks.bulkEdit;
  protected readonly disksTooltip = this.translate.instant(helptextDisks.bulkEdit.disks.tooltip);
  protected readonly hddstandbyOptions = translateOptions(this.translate, helptextDisks.standbyOptions);
  protected readonly advpowermgmtOptions = translateOptions(
    this.translate,
    helptextDisks.advancedPowerManagementOptions,
  );

  readonly canSubmit = this.trackCanSubmit(this.isLoading);

  ngOnInit(): void {
    const disks = this.slideInRef
      ? this.slideInRef.getData() as Disk[]
      : this.disksToEdit();
    this.setFormDiskBulk(disks ?? []);
  }

  private setFormDiskBulk(selectedDisks: Disk[]): void {
    const setForm: Required<DiskBulkEditComponent['form']['value']> = {
      disknames: [],
      hddstandby: '' as DiskStandby,
      advpowermgmt: '' as DiskPowerLevel,
    };
    const hddStandby: DiskStandby[] = [];
    const advPowerMgt: DiskPowerLevel[] = [];

    this.diskIds = [];
    selectedDisks.forEach((disk) => {
      this.diskIds.push(disk.identifier);
      setForm.disknames.push(disk.name);
      hddStandby.push(disk.hddstandby);
      advPowerMgt.push(disk.advpowermgmt);
    });

    // If all items match in an array, this fills in the value in the form; otherwise, blank
    if (hddStandby.every((val, i, arr) => val === arr[0])) {
      setForm.hddstandby = hddStandby[0] || null;
    } else {
      setForm.hddstandby = null;
    }

    if (advPowerMgt.every((val, i, arr) => val === arr[0])) {
      setForm.advpowermgmt = advPowerMgt[0] || null;
    } else {
      setForm.advpowermgmt = null;
    }

    this.form.patchValue({ ...setForm });
    this.form.controls.disknames.disable();
  }

  private prepareDataSubmit(): [id: string, update: DiskUpdate][] {
    const data = { ...this.form.value };

    Object.keys(data).forEach((key) => {
      if (data[key as keyof typeof data] === null) {
        delete data[key as keyof typeof data];
      }
    });

    return this.diskIds.map((id) => [id, data]);
  }

  protected onSubmit(): void {
    const req = this.prepareDataSubmit();
    const successText = this.translate.instant(
      'Successfully saved {n, plural, one {Disk} other {Disks}} settings.',
      { n: req.length },
    );
    this.isLoading.set(true);
    this.api
      .job('core.bulk', ['disk.update', req])
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (job) => {
          if (job.state !== JobState.Success) {
            return;
          }

          this.isLoading.set(false);
          const isSuccessful = job.result.every((result) => {
            if (result.error !== null) {
              this.dialogService.error({
                title: helptextDisks.errorDialogTitle,
                message: result.error,
              });
              return false;
            }

            return true;
          });

          if (isSuccessful) {
            this.closeWith(req.map((diskUpdate) => ({
              identifier: diskUpdate[0],
              ...diskUpdate[1],
            })));
            this.snackbarService.success(successText);
          } else {
            this.closeWith([]);
          }
        },
        error: (error: unknown) => {
          this.isLoading.set(false);
          this.closeWith([]);
          this.errorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
