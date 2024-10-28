import {
  Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { Validators, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatAnchor, MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle,
} from '@angular/material/dialog';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { RollbackRecursiveType } from 'app/enums/rollback-recursive-type.enum';
import { helptextSnapshots } from 'app/helptext/storage/snapshots/snapshots';
import { ZfsRollbackParams, ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-snapshot-rollback-dialog',
  templateUrl: './snapshot-rollback-dialog.component.html',
  styleUrls: ['./snapshot-rollback-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  ],
})
export class SnapshotRollbackDialogComponent implements OnInit {
  readonly requiredRoles = [Role.SnapshotWrite];

  isLoading = true;
  wasDatasetRolledBack = false;
  form = this.fb.group({
    recursive: ['' as RollbackRecursiveType],
    force: [false, [Validators.requiredTrue]],
  });

  publicSnapshot: ZfsSnapshot;

  readonly recursive = {
    fcName: 'recursive',
    tooltip: helptextSnapshots.rollback_recursive_radio_tooltip,
    label: helptextSnapshots.rollback_recursive_radio_placeholder,
    options: of([
      {
        value: '',
        label: helptextSnapshots.rollback_dataset_placeholder,
        tooltip: helptextSnapshots.rollback_dataset_tooltip,
      },
      {
        value: RollbackRecursiveType.Recursive,
        label: helptextSnapshots.rollback_recursive_placeholder,
        tooltip: helptextSnapshots.rollback_recursive_tooltip,
      },
      {
        value: RollbackRecursiveType.RecursiveClones,
        label: helptextSnapshots.rollback_recursive_clones_placeholder,
        tooltip: helptextSnapshots.rollback_recursive_clones_tooltip,
      },
    ]),
  };

  readonly force = {
    fcName: 'force',
    label: helptextSnapshots.rollback_confirm,
    required: true,
  };

  constructor(
    private websocket: WebSocketService,
    private loader: AppLoaderService,
    private fb: FormBuilder,
    private errorHandler: ErrorHandlerService,
    private formErrorHandler: FormErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private dialogService: DialogService,
    @Inject(MAT_DIALOG_DATA) private snapshotName: string,
  ) {}

  ngOnInit(): void {
    this.getSnapshotCreationInfo();
  }

  /**
   * Gets snapshot creation info
   * Needed only for 'snapshot.created' to use in text
   * Possibly can be removed
   */
  getSnapshotCreationInfo(): void {
    this.websocket.call('zfs.snapshot.query', [[['id', '=', this.snapshotName]]]).pipe(
      map((snapshots) => snapshots[0]),
      untilDestroyed(this),
    ).subscribe({
      next: (snapshot) => {
        this.publicSnapshot = snapshot;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.dialogService.error(this.errorHandler.parseError(error));
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

    this.websocket.call('zfs.snapshot.rollback', [this.snapshotName, body]).pipe(
      this.loader.withLoader(),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.wasDatasetRolledBack = true;
        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.formErrorHandler.handleWsFormError(error, this.form);
      },
    });
  }
}
