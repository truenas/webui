import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  UntilDestroy, untilDestroyed,
} from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/storage/volumes/volume-import-wizard';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { PoolFindResult } from 'app/interfaces/pool-import.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { DialogService } from 'app/services';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './import-pool.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportPoolComponent implements OnInit {
  readonly helptext = helptext;
  isLoading = false;

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
    private slideInService: IxSlideInService,
    private ws: WebSocketService,
    private dialog: MatDialog,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.ws.job('pool.import_find').pipe(untilDestroyed(this)).subscribe({
      next: (importablePoolFindJob) => {
        if (importablePoolFindJob.state !== JobState.Success) {
          return;
        }

        this.isLoading = false;
        const result: PoolFindResult[] = importablePoolFindJob.result;
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
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe({
      next: () => {
        dialogRef.close(true);
        this.isLoading = false;
        this.slideInService.close(null, true);
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
}
