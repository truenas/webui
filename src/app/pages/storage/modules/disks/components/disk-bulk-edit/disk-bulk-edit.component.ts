import {
  ChangeDetectionStrategy, Component, OnInit, inject, input,
} from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnFormFieldComponent, TnFormSectionComponent, TnIconComponent, TnSelectComponent,
} from '@truenas/ui-components';
import { filter, map, take } from 'rxjs/operators';
import { DiskPowerLevel } from 'app/enums/disk-power-level.enum';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { helptextDisks } from 'app/helptext/storage/disks/disks';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Disk, DiskUpdate } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  IxFormHostForm,
} from 'app/modules/forms/ix-forms/components/ix-form/ix-form-host-form.directive';
import { IxFormComponent, SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { optionTestIdByLabel } from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { translateOptions } from 'app/modules/translate/translate.helper';
import { ApiService } from 'app/modules/websocket/api.service';
import { DiskFormResponse } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';

/** One `disk.update` argument pair, as `core.bulk` takes them. */
type DiskBulkUpdate = [id: string, update: DiskUpdate];

/** What a finished `core.bulk` leaves the form to act on: what applied, and every per-disk result. */
interface DiskBulkResult {
  applied: DiskBulkUpdate[];
  results: CoreBulkResponse[];
}

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
export class DiskBulkEditComponent extends IxFormHostForm<DiskFormResponse> implements OnInit {
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

  protected readonly optionTestIdByLabel = optionTestIdByLabel;

  ngOnInit(): void {
    this.setFormDiskBulk(this.disksToEdit());
  }

  protected readonly handleSubmit = (): SubmitResult<DiskFormResponse, DiskBulkResult> => {
    const req = this.prepareDataSubmit();
    const successText = this.translate.instant(
      'Successfully saved {n, plural, one {Disk} other {Disks}} settings.',
      { n: req.length },
    );

    return {
      request$: this.api.job('core.bulk', ['disk.update', req]).pipe(
        filter((job) => job.state === JobState.Success),
        take(1),
        // core.bulk reports per-disk failures in its result rather than failing the job, so keep
        // the per-disk errors alongside the entries that did apply for `onSuccess` to report.
        // One result per request, in order — but read defensively in both places rather than
        // trusting that and throwing mid-save if a response ever comes back short.
        //
        // core.bulk is not transactional: the disks that reported no error were already updated
        // on the backend, so resolve with just those — otherwise the list keeps showing pre-edit
        // values for disks that did change. An all-failed bulk resolves with an empty list, which
        // still reloads, matching what the pre-migration form closed with either way.
        map((job) => {
          const results = job.result ?? [];
          return {
            applied: req.filter((_, index) => results[index]?.error === null),
            results,
          };
        }),
      ),
      // Both raised from `onSuccess` (the template suppresses `<ix-form>`'s own snackbar), which
      // runs as the panel closes — reporting from inside `request$` would put the error dialog
      // over a panel still held open by the submit feedback delay, which then slides away under
      // it. The snackbar only when every disk was applied: a partial failure still resolves
      // successfully, but it has already reported itself through the error dialog, and
      // "Successfully saved" beside that dialog would lie.
      successMessage: null,
      onSuccess: ({ applied, results }) => {
        this.reportFailures(results);
        if (applied.length === req.length) {
          this.snackbar.success(successText);
        }
      },
      // The panel host forwards this to its opener, which reconciles the rows that changed.
      closeWith: ({ applied }) => this.toResponse(applied),
    };
  };

  /**
   * One dialog for the whole bulk, listing each distinct reason: a dialog per failed disk was a
   * storm, but three disks failing three different ways must not collapse to whichever came first.
   * `dialogService.error` renders a single report as the plain error dialog and several as one
   * multi-error dialog, so a lone failure looks exactly as it did before.
   */
  private reportFailures(results: CoreBulkResponse[]): void {
    const messages = [...new Set(
      results.map((result) => result?.error).filter((error): error is string => Boolean(error)),
    )];
    if (!messages.length) {
      return;
    }

    const title = this.translate.instant(helptextDisks.errorDialogTitle);
    this.dialogService.error(messages.map((message) => ({ title, message })));
  }

  private setFormDiskBulk(selectedDisks: Disk[]): void {
    const setForm: Required<DiskBulkEditComponent['form']['value']> = {
      disknames: [],
      hddstandby: '' as DiskStandby,
      advpowermgmt: '' as DiskPowerLevel,
    };
    const hddStandby: DiskStandby[] = [];
    const advPowerMgt: DiskPowerLevel[] = [];

    // Assigned, not appended to: a second call would otherwise submit each disk twice.
    this.diskIds = selectedDisks.map((disk) => disk.identifier);

    selectedDisks.forEach((disk) => {
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

  private toResponse(entries: DiskBulkUpdate[]): DiskFormResponse {
    return entries.map(([identifier, diskUpdate]) => ({ identifier, ...diskUpdate }));
  }

  private prepareDataSubmit(): DiskBulkUpdate[] {
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
