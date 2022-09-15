import {
  Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { UntypedFormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { RollbackRecursiveType } from 'app/enums/rollback-recursive-type.enum';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { ZfsRollbackParams, ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { AppLoaderService, WebSocketService, DialogService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './snapshot-rollback-dialog.component.html',
  styleUrls: ['./snapshot-rollback-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnapshotRollbackDialogComponent implements OnInit {
  isLoading = true;
  wasDatasetRolledBack = false;
  form = this.fb.group({
    recursive: ['' as RollbackRecursiveType],
    force: [false, [Validators.requiredTrue]],
  });
  publicSnapshot: ZfsSnapshot;

  readonly recursive = {
    fcName: 'recursive',
    tooltip: helptext.rollback_recursive_radio_tooltip,
    label: helptext.rollback_recursive_radio_placeholder,
    options: of([
      {
        value: '',
        label: helptext.rollback_dataset_placeholder,
        tooltip: helptext.rollback_dataset_tooltip,
      },
      {
        value: RollbackRecursiveType.Recursive,
        label: helptext.rollback_recursive_placeholder,
        tooltip: helptext.rollback_recursive_tooltip,
      },
      {
        value: RollbackRecursiveType.RecursiveClones,
        label: helptext.rollback_recursive_clones_placeholder,
        tooltip: helptext.rollback_recursive_clones_tooltip,
      },
    ]),
  };

  readonly force = {
    fcName: 'force',
    label: helptext.rollback_confirm,
    required: true,
  };

  constructor(
    private websocket: WebSocketService,
    private loader: AppLoaderService,
    private fb: UntypedFormBuilder,
    private errorHandler: FormErrorHandlerService,
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
      error: (error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        this.dialogService.errorReportMiddleware(error);
      },
    });
  }

  onSubmit(): void {
    const body: ZfsRollbackParams[1] = {
      force: true,
    };
    if (this.form.value.recursive) {
      body.recursive = true;
    }

    this.websocket.call('zfs.snapshot.rollback', [this.snapshotName, body]).pipe(
      tap(() => this.loader.open()),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.loader.close();
        this.wasDatasetRolledBack = true;
        this.cdr.markForCheck();
      },
      error: (error) => {
        this.loader.close();
        this.errorHandler.handleWsFormError(error, this.form);
      },
    });
  }
}
