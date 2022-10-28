import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  UntilDestroy, untilDestroyed,
} from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/storage/volumes/volume-import-wizard';
import { Job } from 'app/interfaces/job.interface';
import { Option } from 'app/interfaces/option.interface';
import { PoolFindResult } from 'app/interfaces/pool-import.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { WebSocketService, DialogService, ModalService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './import-pool.component.html',
  styleUrls: ['./import-pool.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImportPoolComponent implements OnInit {
  readonly helptext = helptext;
  isLoading = false;

  formGroup = this.fb.group({
    guid: ['' as string, Validators.required],
  });

  pool: {
    readonly fcName: 'guid';
    label: string;
    tooltip: string;
    options: Observable<Option[]>;
  } = {
      fcName: 'guid',
      label: helptext.guid_placeholder,
      tooltip: helptext.guid_tooltip,
      options: of([]),
    };

  constructor(
    private fb: FormBuilder,
    private slideInService: IxSlideInService,
    private modalService: ModalService,
    private ws: WebSocketService,
    private dialog: MatDialog,
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
      error: (error) => {
        this.dialogService.errorReportMiddleware(error);
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
        this.slideInService.close();
        this.modalService.refreshTable();
      },
      error: (error) => {
        this.dialogService.errorReportMiddleware(error);
      },
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe({
      next: (failureData) => {
        dialogRef.close(false);
        this.isLoading = false;
        this.errorReport(failureData);
      },
      error: (error) => {
        this.dialogService.errorReportMiddleware(error);
      },
    });
  }

  errorReport(error: Job | WebsocketError): void {
    if ('reason' in error && error.reason && error.trace) {
      this.dialogService.errorReport(this.translate.instant('Error importing pool'), error.reason, error.trace.formatted);
    } else if ('exception' in error && error.error && error.exception) {
      this.dialogService.errorReport(this.translate.instant('Error importing pool'), error.error, error.exception);
    } else {
      console.error(error);
    }
  }
}
