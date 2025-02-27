import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { translateOptions } from 'app/helpers/translate.helper';
import { helptextDisks } from 'app/helptext/storage/disks/disks';
import { Disk, DiskUpdate } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-disk-bulk-edit',
  templateUrl: 'disk-bulk-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ModalHeaderComponent,
    MatCard,
    MatCardContent,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxChipsComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class DiskBulkEditComponent {
  protected readonly requiredRoles = [Role.DiskWrite];

  diskIds: string[] = [];
  isLoading = false;
  form = this.fb.group({
    disknames: [null as string[] | null],
    hddstandby: [null as DiskStandby | null],
    advpowermgmt: [null as DiskPowerLevel | null],
    togglesmart: [false],
  });

  readonly helptext = helptextDisks;
  readonly helptextBulkEdit = helptextDisks.bulk_edit;
  readonly hddstandbyOptions$ = of(helptextDisks.disk_form_hddstandby_options);
  readonly advpowermgmtOptions$ = of(translateOptions(this.translate, this.helptext.disk_form_advpowermgmt_options));

  constructor(
    private fb: FormBuilder,
    private dialogService: DialogService,
    private api: ApiService,
    private translate: TranslateService,
    private snackbarService: SnackbarService,
    private errorHandler: FormErrorHandlerService,
    public slideInRef: SlideInRef<Disk[], boolean>,
  ) {
    this.slideInRef.requireConfirmationWhen(() => {
      return of(this.form.dirty);
    });
    this.setFormDiskBulk(this.slideInRef.getData());
  }

  setFormDiskBulk(selectedDisks: Disk[]): void {
    const setForm: DiskBulkEditComponent['form']['value'] = {
      disknames: [],
      hddstandby: '' as DiskStandby,
      advpowermgmt: '' as DiskPowerLevel,
      togglesmart: false,
    };
    const hddStandby: DiskStandby[] = [];
    const advPowerMgt: DiskPowerLevel[] = [];

    selectedDisks.forEach((disk) => {
      this.diskIds.push(disk.identifier);
      setForm.disknames.push(disk.name);
      hddStandby.push(disk.hddstandby);
      advPowerMgt.push(disk.advpowermgmt);
      if (disk.togglesmart) {
        setForm.togglesmart = true;
      }
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

  prepareDataSubmit(): [id: string, update: DiskUpdate][] {
    const data = { ...this.form.value };

    Object.keys(data).forEach((key) => {
      if (data[key as keyof typeof data] === null) {
        delete data[key as keyof typeof data];
      }
    });

    return this.diskIds.map((id) => [id, data]);
  }

  onSubmit(): void {
    const req = this.prepareDataSubmit();
    const successText = this.translate.instant(
      'Successfully saved {n, plural, one {Disk} other {Disks}} settings.',
      { n: req.length },
    );
    this.isLoading = true;
    this.api.job('core.bulk', ['disk.update', req])
      .pipe(untilDestroyed(this)).subscribe({
        next: (job) => {
          if (job.state !== JobState.Success) {
            return;
          }

          this.isLoading = false;
          const isSuccessful = job.result.every((result) => {
            if (result.error !== null) {
              this.slideInRef.close({ response: false, error: result.error });
              this.dialogService.error({
                title: helptextDisks.dialog_error,
                message: result.error,
              });
              return false;
            }

            return true;
          });

          if (isSuccessful) {
            this.slideInRef.close({ response: true, error: null });
            this.snackbarService.success(successText);
          }
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.slideInRef.close({ response: false, error });
          this.errorHandler.handleValidationErrors(error, this.form);
        },
      });
  }
}
