import {
  ChangeDetectionStrategy, Component, OnInit, inject, input,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnFormFieldComponent, TnFormSectionComponent, TnIconComponent, TnSelectComponent,
} from '@truenas/ui-components';
import {
  filter, map, take, tap,
} from 'rxjs/operators';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextDisks } from 'app/helptext/storage/disks/disks';
import { Disk, DiskUpdate } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxFormHostForm,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  advPowerManagementOptionTestId, DiskFormResponse,
} from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';

@Component({
  selector: 'ix-disk-bulk-edit',
  templateUrl: 'disk-bulk-edit.component.html',
  styleUrl: 'disk-bulk-edit.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    IxFormComponent,
    ReactiveFormsModule,
    TnFormSectionComponent,
    TnFormFieldComponent,
    TnIconComponent,
    TnSelectComponent,
    TranslateModule,
  ],
})
export class DiskBulkEditComponent extends IxFormHostForm<DiskFormResponse | null> implements OnInit {
  private fb = inject(NonNullableFormBuilder);
  private dialogService = inject(DialogService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);

  /** The disks being edited, supplied by the `<tn-side-panel>` host before `ngOnInit`. */
  readonly disksToEdit = input.required<Disk[]>();

  protected readonly requiredRoles = [Role.DiskWrite];

  private diskIds: string[] = [];

  protected form = this.fb.group({
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

  protected readonly optionLabelTestId = advPowerManagementOptionTestId;

  // Captured on a successful save so the panel host can hand the updated disks back to its
  // opener: `<ix-form>` emits a bare `true` in the side-panel host, dropping the payload.
  // A partial failure resolves through this same path (with the subset that was applied), so
  // `onFormClosed` is the only place `closed` is ever emitted from.
  private submittedResponse: DiskFormResponse | null = null;

  ngOnInit(): void {
    this.setFormDiskBulk(this.disksToEdit());
  }

  protected readonly handleSubmit = (): SubmitResult => {
    const req = this.prepareDataSubmit();
    const successText = this.translate.instant(
      'Successfully saved {n, plural, one {Disk} other {Disks}} settings.',
      { n: req.length },
    );

    return {
      request$: this.api.job('core.bulk', ['disk.update', req]).pipe(
        filter((job) => job.state === JobState.Success),
        take(1),
        // core.bulk reports per-disk failures in its result rather than failing the job, so
        // surface the first one here. Reporting is a side effect, so it stays in `tap` and out
        // of the `map` below, which only reshapes the payload.
        tap((job) => {
          const failure = job.result.find((result) => result.error !== null);
          if (failure) {
            this.dialogService.error({
              title: this.translate.instant(helptextDisks.errorDialogTitle),
              message: failure.error,
            });
          }
        }),
        // core.bulk is not transactional: the disks that reported no error were already
        // updated on the backend. Resolve with just those so the opener reconciles the rows
        // that really changed and reloads — otherwise the list keeps showing pre-edit values
        // for disks that did change. An all-failed bulk resolves with an empty list, which
        // still reloads, which is what the pre-migration form closed with in either case.
        map((job) => (
          job.result.some((result) => result.error !== null)
            ? req.filter((_, index) => job.result[index]?.error === null)
            : req
        )),
      ),
      // `<ix-form>`'s own snackbar is suppressed unconditionally (`[suppressSuccessSnackbar]`
      // in the template) and raised from `onSuccess` below instead, only when every disk was
      // applied: a partially failed bulk still resolves successfully, but it has already
      // reported itself through an error dialog, and a "Successfully saved" toast beside that
      // dialog would be a lie. `successMessage` is therefore never read by `<ix-form>` — it is
      // here only because `SubmitResult` requires it.
      successMessage: successText,
      onSuccess: (result) => {
        const saved = result as [id: string, update: DiskUpdate][];
        this.submittedResponse = this.toResponse(saved);
        if (saved.length === req.length) {
          this.snackbar.success(successText);
        }
      },
    };
  };

  protected onFormClosed(): void {
    this.closed.emit(this.submittedResponse);
  }

  private setFormDiskBulk(selectedDisks: Disk[]): void {
    const setForm: Required<DiskBulkEditComponent['form']['value']> = {
      disknames: [],
      hddstandby: '' as DiskStandby,
      advpowermgmt: '' as DiskPowerLevel,
    };
    const hddStandby: DiskStandby[] = [];
    const advPowerMgt: DiskPowerLevel[] = [];

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

  private toResponse(entries: [id: string, update: DiskUpdate][]): DiskFormResponse {
    return entries.map(([identifier, diskUpdate]) => ({ identifier, ...diskUpdate }));
  }

  private prepareDataSubmit(): [id: string, update: DiskUpdate][] {
    // `form.value` (not getRawValue) so the disabled, display-only `disknames`
    // control never leaks into the update payload.
    const data = { ...this.form.value };

    Object.keys(data).forEach((key) => {
      if (data[key as keyof typeof data] === null) {
        delete data[key as keyof typeof data];
      }
    });

    return this.diskIds.map((id) => [id, data]);
  }
}
