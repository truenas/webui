import { Component, ChangeDetectionStrategy, ChangeDetectorRef, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatAnchor, MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle,
} from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnBannerComponent } from '@truenas/ui-components';
import { toZonedTime, fromZonedTime } from 'date-fns-tz';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
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
  protected snapshotName = inject<string>(MAT_DIALOG_DATA);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SnapshotWrite];

  isLoading = true;
  wasDatasetRolledBack = false;
  form = this.fb.group({
    recursive: ['' as RollbackRecursiveType],
    force: [null as (boolean | null), [Validators.requiredTrue]],
  });

  protected snapshot: ZfsSnapshot | undefined;
  protected creationTimestampMs: number | undefined;
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
      map((snapshots) => snapshots[0]),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (snapshot) => {
        this.snapshot = snapshot;
        this.creationTimestampMs = getSnapshotCreationMs(snapshot);
        this.creationMachineTime = this.toMachineTime(this.creationTimestampMs);
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  // Mirrors `ix-date`: convert a UTC instant into the wall-clock time of the
  // NAS machine timezone so the date displayed here matches the list column.
  private toMachineTime(timestampMs: number | undefined): Date | undefined {
    if (timestampMs === undefined) {
      return undefined;
    }
    const browserTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const utc = fromZonedTime(timestampMs, browserTz);
    return toZonedTime(utc, this.localeService.timezone);
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
