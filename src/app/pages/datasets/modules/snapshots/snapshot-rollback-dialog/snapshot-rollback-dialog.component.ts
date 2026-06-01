import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, ChangeDetectionStrategy, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnBannerComponent, TnDialogShellComponent } from '@truenas/ui-components';
import { of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { RollbackRecursiveType } from 'app/enums/rollback-recursive-type.enum';
import { helptextSnapshots } from 'app/helptext/storage/snapshots/snapshots';
import { ZfsRollbackParams, ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { LocaleService } from 'app/modules/language/locale.service';
import { LoaderService } from 'app/modules/loader/loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { getSnapshotCreationMs } from 'app/pages/datasets/modules/snapshots/utils/snapshot-creation.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-snapshot-rollback-dialog',
  templateUrl: './snapshot-rollback-dialog.component.html',
  styleUrls: ['./snapshot-rollback-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    MatProgressSpinner,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxRadioGroupComponent,
    IxCheckboxComponent,
    MatButton,
    FormatDateTimePipe,
    RequiresRolesDirective,
    TestDirective,
    FormActionsComponent,
    RouterLink,
    MatAnchor,
    TnBannerComponent,
  ],
})
export class SnapshotRollbackDialog implements OnInit {
  private api = inject(ApiService);
  private loader = inject(LoaderService);
  private fb = inject(FormBuilder);
  private errorHandler = inject(ErrorHandlerService);
  private formErrorHandler = inject(FormErrorHandlerService);
  private localeService = inject(LocaleService);
  private dialogRef = inject(DialogRef);
  // `DIALOG_DATA` is whatever the caller passed to `dialog.open(...)` and
  // can be missing if invoked without data; type it honestly and guard in
  // `ngOnInit` before touching any of its properties.
  protected readonly snapshot = inject<ZfsSnapshot | undefined>(DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SnapshotWrite];

  // Only true while we fall back to fetching the creation timestamp; when the
  // caller already provided `properties.creation` (the common path) we skip the
  // round trip and render the form immediately.
  protected readonly isLoading = signal(false);
  protected readonly wasDatasetRolledBack = signal(false);
  protected readonly creationMachineTime = signal<Date | undefined>(undefined);

  form = this.fb.group({
    recursive: ['' as RollbackRecursiveType],
    force: [null as (boolean | null), [Validators.requiredTrue]],
  });

  readonly recursive = {
    fcName: 'recursive',
    tooltip: helptextSnapshots.stopRollbackTooltip,
    label: helptextSnapshots.stopRollbackLabel,
    options: of([
      {
        value: '',
        label: helptextSnapshots.rollbackDatasetLabel,
        tooltip: helptextSnapshots.rollbackDatasetTooltip,
      },
      {
        value: RollbackRecursiveType.Recursive,
        label: helptextSnapshots.rollbackRecursiveLabel,
        tooltip: helptextSnapshots.rollbackRecursiveTooltip,
      },
      {
        value: RollbackRecursiveType.RecursiveClones,
        label: helptextSnapshots.rollbackRecursiveClonesLabel,
        tooltip: helptextSnapshots.rollbackRecursiveClonesTooltip,
      },
    ]),
  };

  readonly force = {
    fcName: 'force',
    label: helptextSnapshots.rollbackConfirm,
    required: true,
  };

  ngOnInit(): void {
    if (!this.snapshot) {
      // Stray `dialog.open(SnapshotRollbackDialog)` without data — close
      // immediately so the template never dereferences an undefined snapshot.
      this.dialogRef.close();
      return;
    }
    // If `properties` is missing entirely the caller didn't fetch them (e.g.
    // extra columns hidden on the list); fall back to a query so we can still
    // show "back to {datetime}". If `properties` is present but `creation` is
    // empty, the server itself has nothing — re-querying won't help, so we
    // render the no-timestamp variant of the prompt.
    if (this.snapshot.properties) {
      this.creationMachineTime.set(this.computeCreationMachineTime(this.snapshot));
      return;
    }
    this.fetchCreationTime();
  }

  private fetchCreationTime(): void {
    // ngOnInit early-returns and closes the dialog when dialog data is
    // missing, but narrow the type for the lint rule that forbids `!`.
    const snapshot = this.snapshot;
    if (!snapshot) {
      return;
    }
    this.isLoading.set(true);
    this.api.call('pool.snapshot.query', [
      [['id', '=', snapshot.name]],
      {
        // `select` projects the `properties` column; `extra.properties` tells
        // middleware which ZFS properties to populate inside it. Both are required.
        select: ['properties'],
        extra: { properties: ['creation'] },
      },
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (snapshots) => {
        const fetched = snapshots[0];
        if (!fetched) {
          // The snapshot was deleted between list-render and this open; close
          // the dialog rather than offering to roll back something that no
          // longer exists. The list will refresh via collection events.
          this.dialogRef.close();
          return;
        }
        // Pre-compute the machine-time Date so it can be interpolated into the
        // translated sentence below. `<ix-date>` can't be embedded inside an
        // ngx-translate {datetime} placeholder, so we mirror its conversion via
        // toMachineTime + formatDateTime here.
        this.creationMachineTime.set(this.computeCreationMachineTime(fetched));
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.dialogRef.close();
      },
    });
  }

  private computeCreationMachineTime(snapshot: ZfsSnapshot | undefined): Date | undefined {
    const creationMs = getSnapshotCreationMs(snapshot);
    return creationMs === undefined ? undefined : this.localeService.toMachineTime(creationMs);
  }

  onSubmit(): void {
    const snapshot = this.snapshot;
    if (!snapshot) {
      return;
    }
    const body: ZfsRollbackParams[1] = {
      force: true,
    };

    if (this.form.value.recursive === RollbackRecursiveType.Recursive) {
      body.recursive = true;
    }

    if (this.form.value.recursive === RollbackRecursiveType.RecursiveClones) {
      body.recursive_clones = true;
    }

    this.api.call('pool.snapshot.rollback', [snapshot.name, body]).pipe(
      this.loader.withLoader(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.wasDatasetRolledBack.set(true);
      },
      error: (error: unknown) => {
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
