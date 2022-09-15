import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatest, Observable, of, throwError,
} from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { DatasetAttachment } from 'app/interfaces/pool-attachment.interface';
import { Process } from 'app/interfaces/process.interface';
import { VolumesListDataset } from 'app/interfaces/volumes-list-pool.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DialogService, WebSocketService } from 'app/services';

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

  constructor(
    private loader: AppLoaderService,
    private fb: FormBuilder,
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
    this.loader.open();
    this.ws.call('pool.dataset.delete', [this.dataset.id, { recursive: true }])
      .pipe(
        catchError((error: WebsocketError) => {
          if (error.reason.includes('Device busy')) {
            return this.askToForceDelete();
          }

          return throwError(() => error);
        }),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.loader.close();
          this.dialogRef.close(true);
        },
        error: (error) => {
          this.dialog.errorReport(
            this.translate.instant(
              'Error deleting dataset {datasetName}.', { datasetName: this.dataset.name },
            ),
            error.reason,
            error.stack,
          );
          this.loader.close();
          this.dialogRef.close(true);
        },
      });
  }

  private askToForceDelete(): Observable<unknown> {
    return this.dialog.confirm({
      title: this.translate.instant('Device Busy'),
      message: this.translate.instant('Force deletion of dataset <i>{datasetName}</i>?', { datasetName: this.dataset.name }),
      buttonMsg: this.translate.instant('Force Delete'),
    }).pipe(
      switchMap((shouldForceDelete) => {
        if (shouldForceDelete) {
          this.ws.call('pool.dataset.delete', [this.dataset.id, {
            recursive: true,
            force: true,
          }]);
        } else {
          return of();
        }
      }),
    );
  }

  private loadDatasetRelatedEntities(): void {
    this.loader.open();
    combineLatest([
      this.ws.call('pool.dataset.attachments', [this.dataset.id]),
      this.ws.call('pool.dataset.processes', [this.dataset.id]),
    ]).pipe(untilDestroyed(this))
      .subscribe({
        next: ([attachments, processes]) => {
          this.attachments = attachments;
          this.setProcesses(processes);

          this.cdr.markForCheck();
          this.loader.close();
        },
        error: (error) => {
          this.loader.close();
          this.dialogRef.close(false);
          this.dialog.errorReportMiddleware(error);
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
    this.form.controls['confirmDatasetName'].setValidators(
      this.validators.confirmValidator(
        this.dataset.name,
        this.translate.instant('Enter dataset name to continue.'),
      ),
    );
  }

  private setDeleteMessage(): void {
    this.deleteMessage = this.translate.instant(
      'The <i><b>{name}</b></i> dataset and all snapshots stored with it <b>will be permanently deleted</b>.',
      { name: this.dataset.name },
    );
  }
}
