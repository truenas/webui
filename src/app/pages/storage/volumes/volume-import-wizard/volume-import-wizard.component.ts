import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import {
  UntilDestroy, untilDestroyed,
} from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { JobState } from 'app/enums/job-state.enum';
import helptext from 'app/helptext/storage/volumes/volume-import-wizard';
import { Option } from 'app/interfaces/option.interface';
import { PoolFindResult } from 'app/interfaces/pool-import.interface';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { WebSocketService, DialogService, ModalService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  templateUrl: './volume-import-wizard.component.html',
  styleUrls: ['./volume-import-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VolumeImportWizardComponent implements OnInit {
  readonly helptext = helptext;
  isFormLoading = false;

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
  ) {
  }

  ngOnInit(): void {
    this.ws.job('pool.import_find').pipe(untilDestroyed(this)).subscribe((res) => {
      if (res.state === JobState.Success) {
        const result: PoolFindResult[] = res.result;
        const opts = result.map((pool) => ({
          label: `${pool.name} | ${pool.guid}`,
          value: pool.guid,
        } as Option));
        this.pool.options = of(opts);
      }
    });
  }

  onSubmit(): void {
    this.isFormLoading = true;
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
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      dialogRef.close(false);
      this.isFormLoading = false;
      this.slideInService.close();
      this.modalService.refreshTable();
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((result) => {
      dialogRef.close(false);
      this.isFormLoading = false;
      this.errorReport(result);
    });
  }

  errorReport(result: any): void {
    if (result.reason && result.trace) {
      this.dialogService.errorReport(this.translate.instant('Error importing pool'), result.reason, result.trace.formatted);
    } else if (result.error && result.exception) {
      this.dialogService.errorReport(this.translate.instant('Error importing pool'), result.error, result.exception);
    } else {
      console.error(result);
    }
  }
}
