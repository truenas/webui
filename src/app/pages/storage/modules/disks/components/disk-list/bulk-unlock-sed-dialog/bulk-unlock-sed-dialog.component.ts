import {
  ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { filter, take } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { JobState } from 'app/enums/job-state.enum';
import { Role } from 'app/enums/role.enum';
import { SedStatus } from 'app/enums/sed-status.enum';
import { CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Disk } from 'app/interfaces/disk.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { sedStatusLabel } from 'app/pages/storage/modules/disks/utils/sed-status-label.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

export interface BulkUnlockSedDialogData {
  /** Every selected disk. Those that aren't locked SEDs are listed as skipped, never sent. */
  disks: Disk[];
}

/** The last attempt's outcome for one disk; a disk that hasn't been tried yet has none. */
interface UnlockResult {
  unlocked: boolean;
  /** Why the disk stayed locked; `null` once it unlocked. */
  error: string | null;
}

/** Only `name` and `password` reach `disk.unlock_sed`; an omitted password lets middleware fall back. */
interface UnlockSedParams {
  name: string;
  password?: string;
}

/**
 * Unlocks every locked SED in the Disks page selection with one `core.bulk` job. A shared password
 * covers every disk and each disk can override it; a disk left with neither is sent without one, so
 * middleware falls back to the disk's saved password, then the global SED password.
 * `core.bulk` isn't transactional, so after a partial failure the dialog stays open: unlocked disks
 * drop out of the next attempt and failed ones keep their error beside a field to retry with.
 */
@Component({
  selector: 'ix-bulk-unlock-sed-dialog',
  templateUrl: './bulk-unlock-sed-dialog.component.html',
  styleUrls: ['./bulk-unlock-sed-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    IxInputComponent,
    TnIconComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    MatButton,
    TestDirective,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class BulkUnlockSedDialog {
  private fb = inject(NonNullableFormBuilder);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private snackbar = inject(SnackbarService);
  private dialogRef = inject<MatDialogRef<BulkUnlockSedDialog, boolean>>(MatDialogRef);
  private destroyRef = inject(DestroyRef);
  private data = inject<BulkUnlockSedDialogData>(MAT_DIALOG_DATA);

  protected readonly Role = Role;

  protected readonly lockedDisks = this.data.disks.filter(
    (disk) => disk.sed && disk.sed_status === SedStatus.Locked,
  );

  /** The rest of the selection, with the SED status that kept each disk out. */
  protected readonly skippedDisks = this.data.disks
    .filter((disk) => !this.lockedDisks.includes(disk))
    .map((disk) => ({ name: disk.name, reason: sedStatusLabel(disk) }));

  protected readonly form = this.fb.group({
    password: [''],
    passwords: this.fb.record<string>(
      Object.fromEntries(this.lockedDisks.map((disk) => [disk.name, ''])),
    ),
  });

  protected readonly results = signal<ReadonlyMap<string, UnlockResult>>(new Map());
  protected readonly isUnlocking = signal(false);

  private readonly pendingDisks = computed(
    () => this.lockedDisks.filter((disk) => !this.results().get(disk.name)?.unlocked),
  );

  protected readonly unlockedCount = computed(() => this.lockedDisks.length - this.pendingDisks().length);
  protected readonly hasFailures = computed(
    () => [...this.results().values()].some((result) => !result.unlocked),
  );

  /** Read by the template, so a disk's row can swap its password field for the outcome. */
  protected resultFor(diskName: string): UnlockResult | undefined {
    return this.results().get(diskName);
  }

  private passwordControl(diskName: string): FormControl<string> {
    return this.form.controls.passwords.controls[diskName];
  }

  protected close(): void {
    // Reload the list behind the dialog whenever anything changed, even if some disks failed.
    this.dialogRef.close(this.unlockedCount() > 0);
  }

  protected onSubmit(): void {
    const disks = this.pendingDisks();
    if (!disks.length || this.isUnlocking()) {
      return;
    }

    const { password: sharedPassword, passwords } = this.form.getRawValue();
    const params = disks.map((disk): [UnlockSedParams] => {
      const password = passwords[disk.name] || sharedPassword;
      return [password ? { name: disk.name, password } : { name: disk.name }];
    });

    this.isUnlocking.set(true);
    this.api.job('core.bulk', ['disk.unlock_sed', params]).pipe(
      filter((job) => job.state === JobState.Success),
      take(1),
      this.loader.withLoader(),
      this.errorHandler.withErrorHandler(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (job) => this.applyResults(disks, job.result ?? []),
      error: () => this.isUnlocking.set(false),
      complete: () => this.isUnlocking.set(false),
    });
  }

  private applyResults(disks: Disk[], bulkResults: CoreBulkResponse[]): void {
    const results = new Map(this.results());
    disks.forEach((disk, index) => {
      const error = bulkResults[index]?.error;
      if (error === null) {
        results.set(disk.name, { unlocked: true, error: null });
        this.passwordControl(disk.name).disable();
      } else {
        // A response that came back short still has to leave the disk retryable, not "pending".
        results.set(disk.name, { unlocked: false, error: error ?? this.translate.instant('Unknown error') });
      }
    });
    this.results.set(results);

    if (!this.pendingDisks().length) {
      this.snackbar.success(this.translate.instant(
        '{n, plural, one {SED disk unlocked successfully} other {# SED disks unlocked successfully}}',
        { n: this.lockedDisks.length },
      ));
      this.dialogRef.close(true);
    }
  }
}
