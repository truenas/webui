import { CdkScrollable } from '@angular/cdk/scrolling';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit,
} from '@angular/core';
import {
  AbstractControl, FormBuilder, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions, MatDialogClose,
} from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { groupBy } from 'lodash-es';
import { Observable, of } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Role } from 'app/enums/role.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { Option, SelectOption } from 'app/interfaces/option.interface';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxRadioGroupComponent } from 'app/modules/forms/ix-forms/components/ix-radio-group/ix-radio-group.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { WarningComponent } from 'app/modules/forms/ix-forms/components/warning/warning.component';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AddToPoolType, ManageUnusedDiskDialogResource } from 'app/pages/storage/components/unused-resources/unused-disk-card/manage-unused-disk-dialog/manage-unused-disk-dialog.interface';

@UntilDestroy()
@Component({
  selector: 'ix-manage-unused-disk-dialog',
  templateUrl: './manage-unused-disk-dialog.component.html',
  styleUrls: ['./manage-unused-disk-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogTitle,
    ReactiveFormsModule,
    CdkScrollable,
    MatDialogContent,
    WarningComponent,
    IxFieldsetComponent,
    IxRadioGroupComponent,
    IxSelectComponent,
    MatDialogActions,
    MatButton,
    TestDirective,
    MatDialogClose,
    RequiresRolesDirective,
    TranslateModule,
  ],
})
export class ManageUnusedDiskDialogComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];

  readonly toPoolOptions$: Observable<SelectOption<AddToPoolType>[]> = of([
    {
      label: this.translate.instant('New Pool'),
      value: AddToPoolType.New,
    }, {
      label: this.translate.instant('Existing Pool'),
      value: AddToPoolType.Existing,
    },
  ]);

  readonly poolOptions$: Observable<Option[]> = of(
    this.resource.pools.filter((pool) => pool.status !== PoolStatus.Offline).map((pool) => ({
      label: pool.name,
      value: pool.id,
    })),
  );

  form = this.fb.group({
    toPool: [AddToPoolType.New],
    pool: [
      null as number | null,
      [
        this.validatorsService.validateOnCondition(
          (control: AbstractControl) => control.parent?.get('toPool')?.value === AddToPoolType.Existing,
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
  ) {}

  get noPoolsDisks(): { formattedDisk: string }[] {
    const diskInfoFormats = this.resource.unusedDisks.filter((disk) => {
      return !disk.exported_zpool;
    }).map((disk) => {
      return {
        detailedDisk: `${buildNormalizedFileSize(disk.size)} ${disk.subsystem === 'nvme' ? disk.subsystem.toUpperCase() : disk.type}`,
        exportedPool: disk.exported_zpool,
      };
    });
    const groupDisks = groupBy(diskInfoFormats, (diskDetailsWithPoolName) => {
      return diskDetailsWithPoolName.detailedDisk + diskDetailsWithPoolName.exportedPool;
    });
    return Object.keys(groupDisks).map((format: string) => {
      return {
        formattedDisk: `${groupDisks[format][0].detailedDisk} x ${groupDisks[format].length}`,
        exportedPool: groupDisks[format][0].exportedPool,
      };
    });
  }

  get exportedPoolsDisks(): { formattedDisk: string; exportedPool: string }[] {
    const diskInfoFormats = this.resource.unusedDisks.filter((disk) => {
      return disk.exported_zpool;
    }).map((disk) => {
      return {
        detailedDisk: `${buildNormalizedFileSize(disk.size)} ${disk.subsystem === 'nvme' ? disk.subsystem.toUpperCase() : disk.type}`,
        exportedPool: disk.exported_zpool,
      };
    });
    const groupDisks = groupBy(diskInfoFormats, (diskDetailsWithPoolName) => {
      return diskDetailsWithPoolName.detailedDisk + diskDetailsWithPoolName.exportedPool;
    });
    return Object.keys(groupDisks).map((format: string) => {
      return {
        formattedDisk: `${groupDisks[format][0].detailedDisk} x ${groupDisks[format].length}`,
        exportedPool: groupDisks[format][0].exportedPool,
      };
    });
  }

  get isExistingMode(): boolean {
    return this.form.controls.toPool.value === AddToPoolType.Existing;
  }

  ngOnInit(): void {
    this.form.controls.toPool.valueChanges.pipe(untilDestroyed(this)).subscribe((value) => {
      if (value === AddToPoolType.New) {
        this.form.controls.pool.reset();
        this.form.controls.pool.setErrors(null);
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

  getWarningText(exportedPool: string): string {
    return `(${exportedPool})`;
  }
}
