import { DIALOG_DATA, DialogRef } from '@angular/cdk/dialog';
import { Component, ChangeDetectionStrategy, OnInit, ChangeDetectorRef, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnCheckboxComponent, TnDialogShellComponent, TnExpansionPanelComponent, TnTooltipDirective } from '@truenas/ui-components';
import { filter, finalize, map } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { CoreBulkQuery, CoreBulkResponse } from 'app/interfaces/core-bulk.interface';
import { Job } from 'app/interfaces/job.interface';
import { ZfsSnapshot } from 'app/interfaces/zfs-snapshot.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { SnapshotDialogData } from 'app/pages/datasets/modules/snapshots/interfaces/snapshot-dialog-data.interface';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-snapshot-batch-delete-dialog',
  templateUrl: './snapshot-batch-delete-dialog.component.html',
  styleUrls: ['./snapshot-batch-delete-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnDialogShellComponent,
    TranslateModule,
    ReactiveFormsModule,
    TnExpansionPanelComponent,
    TnCheckboxComponent,
    TnTooltipDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    FormActionsComponent,
  ],
})
export class SnapshotBatchDeleteDialog implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  protected dialogRef = inject<DialogRef<boolean, SnapshotBatchDeleteDialog>>(DialogRef);
  private errorHandler = inject(ErrorHandlerService);
  private cdr = inject(ChangeDetectorRef);
  private snapshots = inject<ZfsSnapshot[]>(DIALOG_DATA);
  private loader = inject(LoaderService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SnapshotDelete];

  isJobCompleted = false;
  isDeleting = signal(false);
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

  ngOnInit(): void {
    this.dialogData = this.prepareDialogData();
  }

  private prepareDialogData(): SnapshotDialogData {
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
    // Guard against accidental submission (e.g. a stray form submit): only an
    // explicit, valid confirmation with no dependent clones may delete.
    if (this.form.invalid || this.hasClones || this.isDeleting()) {
      return;
    }
    this.isDeleting.set(true);
    const snapshots = this.snapshots.map((item) => [item.name]);
    const params: CoreBulkQuery = ['pool.snapshot.delete', snapshots];
    this.api.job('core.bulk', params).pipe(
      this.loader.withLoader(),
      filter((job: Job<CoreBulkResponse<boolean>[]>) => !!job.result),
      map((job: Job<CoreBulkResponse<boolean>[]>) => job.result),
      finalize(() => this.isDeleting.set(false)),
      takeUntilDestroyed(this.destroyRef),
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
      error: (error: unknown) => {
        this.errorHandler.showErrorModal(error);
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
