import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { of } from 'rxjs';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { WidgetUtils } from 'app/pages/dashboard/utils/widget-utils';
import { AddToPoolType, ManageUnusedDiskDialogResource } from './manage-unused-disk-dialog.interface';

@UntilDestroy()
@Component({
  templateUrl: './manage-unused-disk-dialog.component.html',
  styleUrls: ['./manage-unused-disk-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManageUnusedDiskDialogComponent implements OnInit {
  private utils: WidgetUtils;

  readonly toPoolOptions$ = of([
    {
      label: this.translate.instant('New Pool'),
      value: AddToPoolType.New,
    }, {
      label: this.translate.instant('Existing Pool'),
      value: AddToPoolType.Existing,
    },
  ]);

  readonly poolOptions$ = of(
    this.resource.pools.map((pool) => ({
      label: pool.name,
      value: pool.id,
    })),
  );

  form = this.fb.group({
    toPool: [AddToPoolType.New],
    pool: [
      null as number,
      [
        this.validatorsService.validateOnCondition(
          (control: AbstractControl) => control.parent?.get('toPool').value === AddToPoolType.Existing,
          Validators.required,
        ),
      ],
    ],
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
    public cdr: ChangeDetectorRef,
    private dialogRef: MatDialogRef<ManageUnusedDiskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public resource: ManageUnusedDiskDialogResource,
  ) {
    this.utils = new WidgetUtils();
  }

  get groupedDisks(): { formattedDisk: string; exportedZpool: string; disksCount: number }[] {
    const diskInfoFormats = this.resource.unusedDisks.map((disk) => {
      return {
        detailedDisk: `${this.utils.convert(disk.size).value} ${this.utils.convert(disk.size).units} ${disk.subsystem === 'nvme' ? disk.subsystem.toUpperCase() : disk.type}`,
        exportedZpool: disk.exported_zpool,
      };
    });
    const groupDisks = _.groupBy(diskInfoFormats, (diskDetailsWithZpoolName) => {
      return diskDetailsWithZpoolName.detailedDisk + diskDetailsWithZpoolName.exportedZpool;
    });
    const groupDiskFormats = Object.keys(groupDisks).map((format: string) => {
      return {
        formattedDisk: `${groupDisks[format][0].detailedDisk} x ${groupDisks[format].length}`,
        disksCount: groupDisks[format].length,
        exportedZpool: groupDisks[format][0].exportedZpool,
      };
    });
    return groupDiskFormats;
  }

  get isExistingMode(): boolean {
    return this.form.controls.toPool.value === AddToPoolType.Existing;
  }

  ngOnInit(): void {
    this.form.controls.toPool.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (value === AddToPoolType.New) {
        this.form.get('pool').reset();
        this.form.get('pool').setErrors(null);
      }
      this.cdr.detectChanges();
    });
  }

  onSubmit(): void {
    this.dialogRef.close();

    const { toPool, pool } = this.form.value;
    if (toPool === AddToPoolType.Existing) {
      this.router.navigate(['/storage', pool, 'add-vdevs']);
    } else {
      this.router.navigate(['/storage', 'create']);
    }
  }

  getWarningText(exportedZpool: string, disksCount: number): string {
    if (disksCount === 1) {
      return this.getWarningForOneDisk(exportedZpool);
    }
    return this.getWarningForMultipleDisks(exportedZpool);
  }

  getWarningForOneDisk(exportedZpool: string): string {
    return this.translate.instant('This disk is part of the exported zpool {zpool}', { zpool: '\'' + exportedZpool + '\'' });
  }

  getWarningForMultipleDisks(exportedZpool: string): string {
    return this.translate.instant('These disks are part of the exported zpool {zpool}', { zpool: '\'' + exportedZpool + '\'' });
  }
}
