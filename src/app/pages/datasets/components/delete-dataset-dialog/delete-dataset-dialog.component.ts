import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle,
} from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  combineLatest, EMPTY, Observable, of, throwError,
} from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { DatasetType } from 'app/enums/dataset.enum';
import { Role } from 'app/enums/role.enum';
import { DatasetAttachment } from 'app/interfaces/pool-attachment.interface';
import { Process } from 'app/interfaces/process.interface';
import { VolumesListDataset } from 'app/interfaces/volumes-list-pool.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-delete-dataset-dialog',
  templateUrl: './delete-dataset-dialog.component.html',
  styleUrls: ['./delete-dataset-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    TranslateModule,
    ReactiveFormsModule,
    MatDialogContent,
    IxInputComponent,
    IxCheckboxComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
  ],
})
export class DeleteDatasetDialogComponent implements OnInit {
  readonly requiredRoles = [Role.DatasetDelete];

  attachments: DatasetAttachment[] = [];
  knownProcesses: Process[] = [];
  unknownProcesses: Process[] = [];

  form = this.fb.group({
    confirmDatasetName: ['', [Validators.required]],
    confirm: [false, Validators.requiredTrue],
  });

  deleteMessage: string;

  get isZvol(): boolean {
    return this.dataset.type === DatasetType.Volume;
  }

  constructor(
    private loader: AppLoaderService,
    private fb: FormBuilder,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialog: DialogService,
    private dialogRef: MatDialogRef<DeleteDatasetDialogComponent>,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private validators: IxValidatorsService,
    @Inject(MAT_DIALOG_DATA) public dataset: VolumesListDataset,
  ) {}

  ngOnInit(): void {
    this.setDeleteMessage();
    this.setConfirmValidator();
    this.loadDatasetRelatedEntities();
  }

  onDelete(): void {
    this.deleteDataset().pipe(
      catchError((error: WebSocketError) => {
        if (error.reason.includes('Device busy')) {
          return this.askToForceDelete();
        }

        return throwError(() => error);
      }),
      this.loader.withLoader(),
      tap(() => {
        this.dialogRef.close(true);
      }),
      catchError(this.handleDeleteError.bind(this)),
      untilDestroyed(this),
    ).subscribe();
  }

  private deleteDataset(): Observable<boolean> {
    return this.ws.call('pool.dataset.delete', [this.dataset.id, { recursive: true }]);
  }

  private forceDeleteDataset(): Observable<boolean> {
    return this.ws.call('pool.dataset.delete', [this.dataset.id, { recursive: true, force: true }]);
  }

  private askToForceDelete(): Observable<unknown> {
    return this.getForceDeleteConfirmation()
      .pipe(
        switchMap((shouldForceDelete: boolean) => {
          return shouldForceDelete ? this.forceDeleteDataset() : of();
        }),
      );
  }

  private getForceDeleteConfirmation(): Observable<boolean> {
    return this.dialog.confirm({
      title: this.translate.instant('Device Busy'),
      message: this.translate.instant('Force deletion of dataset <i>{datasetName}</i>?', { datasetName: this.dataset.name }),
      buttonText: this.translate.instant('Force Delete'),
    });
  }

  private handleDeleteError(error: { reason: string; stack: string; [key: string]: unknown }): Observable<void> {
    this.dialog.error({
      title: this.translate.instant(
        'Error deleting dataset {datasetName}.',
        { datasetName: this.dataset.name },
      ),
      message: error.reason,
      backtrace: error.stack,
    });
    this.dialogRef.close(true);
    return EMPTY;
  }

  private loadDatasetRelatedEntities(): void {
    combineLatest([
      this.ws.call('pool.dataset.attachments', [this.dataset.id]),
      this.ws.call('pool.dataset.processes', [this.dataset.id]),
    ]).pipe(this.loader.withLoader(), untilDestroyed(this))
      .subscribe({
        next: ([attachments, processes]) => {
          this.attachments = attachments;
          this.setProcesses(processes);

          this.cdr.markForCheck();
        },
        error: (error: unknown) => {
          this.dialogRef.close(false);
          this.dialog.error(this.errorHandler.parseError(error));
        },
      });
  }

  private setProcesses(processes: Process[]): void {
    processes.forEach((process) => {
      if (process.service) {
        return;
      }

      if (process.name && process.name !== '') {
        this.knownProcesses.push(process);
      } else {
        this.unknownProcesses.push(process);
      }
    });
  }

  private setConfirmValidator(): void {
    let confirmMessage = this.translate.instant('Enter dataset name to continue.');
    if (this.isZvol) {
      confirmMessage = this.translate.instant('Enter zvol name to continue.');
    }

    this.form.controls.confirmDatasetName.setValidators(
      this.validators.confirmValidator(
        this.dataset.name,
        confirmMessage,
      ),
    );
  }

  private setDeleteMessage(): void {
    if (this.isZvol) {
      this.deleteMessage = this.translate.instant(
        'The <i><b>{name}</b></i> zvol and all snapshots stored with it <b>will be permanently deleted</b>.',
        { name: this.dataset.name },
      );
    } else {
      this.deleteMessage = this.translate.instant(
        'The <i><b>{name}</b></i> dataset and all snapshots stored with it <b>will be permanently deleted</b>.',
        { name: this.dataset.name },
      );
    }
  }
}
