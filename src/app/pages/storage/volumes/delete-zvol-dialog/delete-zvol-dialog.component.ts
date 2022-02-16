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
import { ZvolAttachment } from 'app/interfaces/pool-attachment.interface';
import { Process } from 'app/interfaces/process.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { AppLoaderService } from 'app/modules/app-loader/app-loader.service';
import { EntityUtils } from 'app/modules/entity/utils';
import IxValidatorsService from 'app/modules/ix-forms/services/ix-validators.service';
import { VolumesListDataset } from 'app/pages/storage/volumes/volumes-list/volumes-list-pool.interface';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  templateUrl: './delete-zvol-dialog.component.html',
  styleUrls: ['./delete-zvol-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeleteZvolDialogComponent implements OnInit {
  attachments: ZvolAttachment[] = [];
  knownProcesses: Process[] = [];
  unknownProcesses: Process[] = [];

  form = this.fb.group({
    confirmZvolName: ['', [Validators.required]],
    confirm: [false, Validators.requiredTrue],
  });

  deleteMessage: string;

  constructor(
    private loader: AppLoaderService,
    private fb: FormBuilder,
    private ws: WebSocketService,
    private dialog: DialogService,
    private dialogRef: MatDialogRef<DeleteZvolDialogComponent>,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private validators: IxValidatorsService,
    @Inject(MAT_DIALOG_DATA) public zvol: VolumesListDataset,
  ) {}

  ngOnInit(): void {
    this.setDeleteMessage();
    this.setConfirmValidator();
    this.loadZvolRelatedEntities();
  }

  onDelete(): void {
    this.loader.open();
    this.ws.call('pool.dataset.delete', [this.zvol.id, { recursive: true }])
      .pipe(
        catchError((error: WebsocketError) => {
          if (error.reason.includes('Device busy')) {
            return this.askToForceDelete();
          }

          return throwError(error);
        }),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.loader.close();
        this.dialogRef.close(true);
      }, (error) => {
        this.dialog.errorReport(
          this.translate.instant(
            'Error deleting zvol {name}.', { name: this.zvol.name },
          ),
          error.reason,
          error.stack,
        );
        this.loader.close();
        this.dialogRef.close(true);
      });
  }

  private askToForceDelete(): Observable<unknown> {
    return this.dialog.confirm({
      title: this.translate.instant('Device Busy'),
      message: this.translate.instant('Force deletion of zvol <i>{name}</i>?', { name: this.zvol.name }),
      buttonMsg: this.translate.instant('Force Delete'),
    }).pipe(
      switchMap((shouldForceDelete) => {
        if (shouldForceDelete) {
          this.ws.call('pool.dataset.delete', [this.zvol.id, {
            recursive: true,
            force: true,
          }]);
          this.loader.close();
        } else {
          this.loader.close();
          return of();
        }
      }),
    );
  }

  private loadZvolRelatedEntities(): void {
    this.loader.open();
    combineLatest([
      this.ws.call('pool.dataset.attachments', [this.zvol.id]),
      this.ws.call('pool.dataset.processes', [this.zvol.id]),
    ]).pipe(untilDestroyed(this))
      .subscribe(([attachments, processes]) => {
        this.attachments = attachments;
        this.setProcesses(processes);

        this.cdr.markForCheck();
        this.loader.close();
      }, (error) => {
        this.loader.close();
        this.dialogRef.close(false);
        (new EntityUtils()).errorReport(error, this.dialog);
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
    this.form.controls['confirmZvolName'].setValidators([
      this.validators.confirmValidator(
        this.zvol.name,
        this.translate.instant('Enter zvol name to continue.'),
      ),
    ]);
  }

  private setDeleteMessage(): void {
    this.deleteMessage = this.translate.instant(
      'The <i><b>{name}</b></i> zvol and all snapshots stored with it <b>will be permanently deleted</b>.',
      { name: this.zvol.name },
    );
  }
}
