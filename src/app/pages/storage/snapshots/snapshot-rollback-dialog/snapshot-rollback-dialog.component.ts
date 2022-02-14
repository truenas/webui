import {
  Component, ChangeDetectionStrategy, Inject, ChangeDetectorRef, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { of } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { RollbackRecursiveType } from 'app/enums/rollback-recursive-type.enum';
import helptext from 'app/helptext/storage/snapshots/snapshots';
import { ZfsRollbackParams } from 'app/interfaces/zfs-snapshot.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { SnapshotListRow } from 'app/pages/storage/snapshots/interfaces/snapshot-list-row.interface';
import { AppLoaderService, WebSocketService, DialogService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'app-snapshot-rollback-dialog',
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
  publicSnapshot: SnapshotListRow;

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
    private fb: FormBuilder,
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
      map((snapshots) => {
        // TODO: Optimize to avoid ZfsSnapshot -> SnapshotListRow transformation in multiple places
        const snapshot = snapshots[0];
        const [datasetName, snapshotName] = snapshot.name.split('@');

        const transformedRow = {
          id: snapshot.name,
          dataset: datasetName,
          snapshot: snapshotName,
          properties: snapshot.properties,
          name: snapshot.name,
        } as SnapshotListRow;

        if (snapshot.properties) {
          return {
            ...transformedRow,
            created: snapshot.properties.creation.parsed.$date,
            used: snapshot.properties.used.parsed as number,
            referenced: snapshot.properties.referenced.parsed as number,
          };
        }

        return transformedRow;
      }),
      untilDestroyed(this),
    ).subscribe(
      (snapshot) => {
        this.publicSnapshot = snapshot;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      (error) => {
        this.isLoading = false;
        this.cdr.markForCheck();
        new EntityUtils().handleWsError(this, error, this.dialogService);
      },
    );
  }

  onSubmit(): void {
    const body: ZfsRollbackParams[1] = {
      force: true,
    };
    if (this.form.value.recursive) {
      body.recursive = true;
    }

    this.websocket.call('zfs.snapshot.rollback', [this.publicSnapshot.name, body]).pipe(
      tap(() => this.loader.open()),
      untilDestroyed(this),
    ).subscribe(() => {
      this.loader.close();
      this.wasDatasetRolledBack = true;
      this.cdr.markForCheck();
    }, (error) => {
      this.loader.close();
      this.errorHandler.handleWsFormError(error, this.form);
    });
  }
}
