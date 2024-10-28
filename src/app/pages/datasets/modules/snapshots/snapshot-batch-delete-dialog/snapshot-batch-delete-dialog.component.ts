import {
  Component, ChangeDetectionStrategy, Inject, OnInit, ChangeDetectorRef,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogClose, MatDialogTitle } from '@angular/material/dialog';
import {
  MatAccordion, MatExpansionPanel, MatExpansionPanelHeader, MatExpansionPanelTitle,
} from '@angular/material/expansion';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SnapshotDialogData } from 'app/pages/datasets/modules/snapshots/interfaces/snapshot-dialog-data.interface';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';

@UntilDestroy()
@Component({
  selector: 'ix-snapshot-batch-delete-dialog',
  templateUrl: './snapshot-batch-delete-dialog.component.html',
  styleUrls: ['./snapshot-batch-delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    TranslateModule,
    ReactiveFormsModule,
    MatAccordion,
    MatExpansionPanel,
    MatExpansionPanelHeader,
    MatExpansionPanelTitle,
    IxCheckboxComponent,
    MatTooltip,
    RequiresRolesDirective,
    TestDirective,
    MatButton,
    MatDialogClose,
    FormActionsComponent,
    RouterLink,
    MatAnchor,
  ],
})
export class SnapshotBatchDeleteDialogComponent implements OnInit {
  readonly requiredRoles = [Role.SnapshotDelete];

  isJobCompleted = false;
  form = this.fb.group({
    confirm: [false, [Validators.requiredTrue]],
  });

  total = this.snapshots.length;
  dialogData: SnapshotDialogData;
  jobSuccess: boolean[] = [];
  jobErrors: string[] = [];

  get hasClones(): boolean {
    return this.snapshots.some((snapshot) => !!snapshot?.properties?.clones?.value);
  }

  constructor(
    private fb: FormBuilder,
    private websocket: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    @Inject(MAT_DIALOG_DATA) private snapshots: ZfsSnapshot[],
    private dialogService: DialogService,
  ) { }

  ngOnInit(): void {
    this.dialogData = this.prepareDialogData();
  }

  prepareDialogData(): SnapshotDialogData {
    const datasets: string[] = [];
    const snapshots: Record<string, string[]> = {};
    this.snapshots.forEach((item) => {
      if (!snapshots[item.dataset]) {
        datasets.push(item.dataset);
        snapshots[item.dataset] = [];
      }

      snapshots[item.dataset].push(item.snapshot_name);
    });

    return { datasets, snapshots };
  }

  onSubmit(): void {
    const snapshots = this.snapshots.map((item) => [item.name]);
    const params: CoreBulkQuery = ['zfs.snapshot.delete', snapshots];
    this.websocket.job('core.bulk', params).pipe(
      filter((job: Job<CoreBulkResponse<boolean>[]>) => !!job.result),
      map((job: Job<CoreBulkResponse<boolean>[]>) => job.result),
      untilDestroyed(this),
    ).subscribe({
      next: (results: CoreBulkResponse<boolean>[]) => {
        results.forEach((item) => {
          if (item.error) {
            this.jobErrors.push(item.error);
          } else {
            this.jobSuccess.push(item.result);
          }
        });
        this.isJobCompleted = true;
        this.cdr.markForCheck();
      },
      error: (error: WebSocketError | Job) => {
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }

  getErrorMessage(): string {
    return this.jobErrors.map((error) => error + '\n')
      .toString()
      .split(',')
      .join('')
      .split('[')
      .join('\n *** [')
      .split(']')
      .join(']\n');
  }
}
