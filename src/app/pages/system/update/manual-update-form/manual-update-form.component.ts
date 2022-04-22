import { Component, OnInit } from '@angular/core';
import { Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { FormBuilder } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ProductType } from 'app/enums/product-type.enum';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService, WebSocketService } from 'app/services';

@UntilDestroy()
@Component({
  selector: 'manual-update-form',
  templateUrl: './manual-update-form.component.html',
  styleUrls: ['manual-update-form.component.scss'],
})
export class ManualUpdateFormComponent implements OnInit {
  form = this.formBuilder.group({
    filelocation: ['', Validators.required],
    rebootAfterManualUpdate: [false],
  });

  isHa = false;

  constructor(
    private dialog: MatDialog,
    protected router: Router,
    private dialogService: DialogService,
    private formBuilder: FormBuilder,
    private ws: WebSocketService,
  ) {}

  ngOnInit(): void {
    this.checkHaLicense();
  }

  checkHaLicense(): void {
    if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)) {
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((isHa) => {
        this.isHa = isHa;
        this.checkForUpdateRunning();
      });
    }
  }

  checkForUpdateRunning(): void {
    this.ws.call('core.get_jobs', [[['method', '=', 'failover.upgrade'], ['state', '=', JobState.Running]]]).pipe(untilDestroyed(this)).subscribe(
      (jobs) => {
        if (jobs && jobs.length > 0) {
          this.showRunningUpdate(jobs[0].id);
        }
      },
      (err) => {
        console.error(err);
      },
    );
  }

  showRunningUpdate(jobId: number): void {
    const dialogRef = this.dialog.open(EntityJobComponent, { data: { title: this.translate.instant('Update') } });
    if (this.isHa) {
      dialogRef.componentInstance.disableProgressValue(true);
    }
    dialogRef.componentInstance.jobId = jobId;
    dialogRef.componentInstance.wsshow();
    dialogRef.componentInstance.success.pipe(untilDestroyed(this)).subscribe(() => {
      this.router.navigate(['/others/reboot']);
    });
    dialogRef.componentInstance.failure.pipe(untilDestroyed(this)).subscribe((err) => {
      new EntityUtils().handleWsError(this, err, this.dialogService);
    });
  }
}
