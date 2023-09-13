import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import {
  UntilDestroy, untilDestroyed,
} from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, UnaryFunction, map, of, pipe, switchMap } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/storage/volumes/volume-import-wizard';
import { Dataset } from 'app/interfaces/dataset.interface';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { PoolFindResult } from 'app/interfaces/pool-import.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './import-pool.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportPoolComponent implements OnInit {
  readonly helptext = helptext;
  isLoading = false;
  importablePools: {
    name: string;
    guid: string;
  }[] = [];

  formGroup = this.fb.group({
    guid: ['' as string, Validators.required],
  });

  pool = {
    fcName: 'guid',
    label: helptext.guid_placeholder,
    tooltip: helptext.guid_tooltip,
    options: of<Option[]>([]),
  };

  constructor(
    private fb: FormBuilder,
    private slideInRef: IxSlideInRef<ImportPoolComponent>,
    private ws: WebSocketService,
    private dialog: MatDialog,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.isLoading = true;
    this.ws.job('pool.import_find').pipe(untilDestroyed(this)).subscribe({
      next: (importablePoolFindJob) => {
        if (importablePoolFindJob.state !== JobState.Success) {
          return;
        }

        this.isLoading = false;
        const result: PoolFindResult[] = importablePoolFindJob.result;
        this.importablePools = result.map((pool) => ({
          name: pool.name,
          guid: pool.guid,
        }));
        const opts = result.map((pool) => ({
          label: `${pool.name} | ${pool.guid}`,
          value: pool.guid,
        } as Option));
        this.pool.options = of(opts);
        this.cdr.markForCheck();
      },
      error: (error: WebsocketError | Job) => {
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }

  onSubmit(): void {
    this.isLoading = true;
    const dialogRef = this.dialog.open(
      EntityJobComponent,
      {
        data: { title: this.translate.instant('Importing Pool') },
        disableClose: true,
      },
    );
    dialogRef.componentInstance.setDescription(this.translate.instant('Importing Pool...'));
    dialogRef.componentInstance.setCall('pool.import_pool', [{ guid: this.formGroup.value.guid }]);
    dialogRef.componentInstance.submit();
    dialogRef.componentInstance.success.pipe(
      this.checkIfUnlockNeeded(),
      untilDestroyed(this),
    ).subscribe({
      next: ([datasets, shouldTryUnlocking]) => {
        dialogRef.close(true);
        this.isLoading = false;
        this.slideInRef.close(true);
        if (shouldTryUnlocking) {
          this.router.navigate(['/datasets', datasets[0].id, 'unlock']);
        }
      },
      error: (error: WebsocketError | Job) => {
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe({
      next: (failureData) => {
        dialogRef.close(false);
        this.isLoading = false;
        this.errorReport(failureData);
      },
      error: (error: WebsocketError | Job) => {
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }

  errorReport(error: Job | WebsocketError): void {
    if ('reason' in error && error.reason && error.trace) {
      this.dialogService.error({
        title: this.translate.instant('Error importing pool'),
        message: error.reason,
        backtrace: error.trace.formatted,
      });
    } else if ('exception' in error && error.error && error.exception) {
      this.dialogService.error({
        title: this.translate.instant('Error importing pool'),
        message: error.error,
        backtrace: error.exception,
      });
    } else {
      console.error(error);
    }
  }

  checkIfUnlockNeeded(): UnaryFunction<Observable<unknown>, Observable<[Dataset[], boolean]>> {
    return pipe(
      switchMap(() => {
        return this.ws.call(
          'pool.dataset.query',
          [[['name', '=', this.importablePools.find((importablePool) => importablePool.guid === this.formGroup.value.guid).name]]],
        );
      }),
      switchMap((poolDatasets): Observable<[Dataset[], boolean]> => {
        if (poolDatasets[0].locked && poolDatasets[0].encryption_root === poolDatasets[0].id) {
          return this.dialogService.confirm({
            title: this.translate.instant('Unlock Pool'),
            message: this.translate.instant('This pool has an encrypted root dataset which is locked. Do you want to unlock it?'),
            hideCheckbox: true,
          }).pipe(
            map((confirmed) => [poolDatasets, confirmed]),
          );
        }
        return of([poolDatasets, false]);
      }),
    );
  }
}
