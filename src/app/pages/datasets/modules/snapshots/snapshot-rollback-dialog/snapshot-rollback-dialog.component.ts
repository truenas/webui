import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatAnchor, MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnBannerComponent } from '@truenas/ui-components';
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
    MatDialogTitle,
    TranslateModule,
    MatDialogContent,
    MatProgressSpinner,
    ReactiveFormsModule,
    IxFieldsetComponent,
    IxRadioGroupComponent,
    IxCheckboxComponent,
    MatButton,
    FormatDateTimePipe,
    RequiresRolesDirective,
    TestDirective,
    MatDialogClose,
    FormActionsComponent,
    RouterLink,
    MatDialogActions,
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
  private cdr = inject(ChangeDetectorRef);
  private localeService = inject(LocaleService);
  private dialogRef = inject(MatDialogRef<SnapshotRollbackDialog>);
  protected readonly snapshot = inject<ZfsSnapshot>(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SnapshotWrite];

  // Only true while we fall back to fetching the creation timestamp; when the
  // caller already provided `properties.creation` (the common path) we skip the
  // round trip and render the form immediately.
  isLoading = false;
  wasDatasetRolledBack = false;
  form = this.fb.group({
    recursive: ['' as RollbackRecursiveType],
    force: [null as (boolean | null), [Validators.requiredTrue]],
  });

  protected creationMachineTime: Date | undefined;

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
    // If `properties` is missing entirely the caller didn't fetch them (e.g.
    // extra columns hidden on the list); fall back to a query so we can still
    // show "back to {datetime}". If `properties` is present but `creation` is
    // empty, the server itself has nothing — re-querying won't help, so we
    // render the no-timestamp variant of the prompt.
    if (this.snapshot.properties) {
      const creationMs = getSnapshotCreationMs(this.snapshot);
      this.creationMachineTime = creationMs === undefined
        ? undefined
        : this.localeService.toMachineTime(creationMs);
      return;
    }
    this.fetchCreationTime();
  }

  private fetchCreationTime(): void {
    this.isLoading = true;
    this.api.call('pool.snapshot.query', [
      [['id', '=', this.snapshot.name]],
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
        const creationMs = getSnapshotCreationMs(fetched);
        // Pre-compute the machine-time Date so it can be interpolated into the
        // translated sentence below. `<ix-date>` can't be embedded inside an
        // ngx-translate {datetime} placeholder, so we mirror its conversion via
        // toMachineTime + formatDateTime here.
        this.creationMachineTime = creationMs === undefined
          ? undefined
          : this.localeService.toMachineTime(creationMs);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
        this.dialogRef.close();
      },
    });
  }

  onSubmit(): void {
    const body: ZfsRollbackParams[1] = {
      force: true,
    };

    if (this.form.value.recursive === RollbackRecursiveType.Recursive) {
      body.recursive = true;
    }

    if (this.form.value.recursive === RollbackRecursiveType.RecursiveClones) {
      body.recursive_clones = true;
    }

    this.api.call('pool.snapshot.rollback', [this.snapshot.name, body]).pipe(
      this.loader.withLoader(),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.wasDatasetRolledBack = true;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.formErrorHandler.handleValidationErrors(error, this.form);
      },
    });
  }
}
