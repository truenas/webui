import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatest, EMPTY, Observable, of, throwError,
} from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { DatasetType } from 'app/enums/dataset.enum';
import { DatasetAttachment } from 'app/interfaces/pool-attachment.interface';
import { Process } from 'app/interfaces/process.interface';
import { VolumesListDataset } from 'app/interfaces/volumes-list-pool.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './delete-dataset-dialog.component.html',
  styleUrls: ['./delete-dataset-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteDatasetDialogComponent implements OnInit {
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
      catchError((error: WebsocketError) => {
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
        'Error deleting dataset {datasetName}.', { datasetName: this.dataset.name },
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
        error: (error: WebsocketError) => {
          this.dialogRef.close(false);
          this.dialog.error(this.errorHandler.parseWsError(error));
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
