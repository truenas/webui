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
  private snapshotName = inject<string>(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SnapshotWrite];

  isLoading = true;
  wasDatasetRolledBack = false;
  form = this.fb.group({
    recursive: ['' as RollbackRecursiveType],
    force: [null as (boolean | null), [Validators.requiredTrue]],
  });

  // Assigned before `isLoading` flips to `false`; the template only references
  // these fields once the loader has hidden, so the non-null types are safe.
  protected snapshot!: ZfsSnapshot;
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
    this.getSnapshotCreationInfo();
  }

  private getSnapshotCreationInfo(): void {
    this.api.call('pool.snapshot.query', [
      [['id', '=', this.snapshotName]],
      {
        // `select` projects the `properties` column; `extra.properties` tells
        // middleware which ZFS properties to populate inside it. Both are required.
        select: ['snapshot_name', 'dataset', 'properties'],
        extra: { properties: ['creation'] },
      },
    ]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (snapshots) => {
        // The snapshot can disappear between the list page rendering and the
        // dialog opening. Close silently — the list will refresh on its own.
        const snapshot = snapshots[0];
        if (!snapshot) {
          this.dialogRef.close();
          return;
        }
        this.snapshot = snapshot;
        const creationMs = getSnapshotCreationMs(snapshot);
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

    this.api.call('pool.snapshot.rollback', [this.snapshotName, body]).pipe(
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
