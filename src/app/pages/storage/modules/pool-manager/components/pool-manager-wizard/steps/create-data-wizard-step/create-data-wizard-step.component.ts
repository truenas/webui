import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import filesize from 'filesize';
import _ from 'lodash';
import { of } from 'rxjs';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { SizeDisksMap } from 'app/pages/storage/modules/pool-manager/interfaces/size-disks-map.interface';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';
import { getSizeDisksMap } from 'app/pages/storage/modules/pool-manager/utils/pool-manager.utils';

@UntilDestroy()
@Component({
  selector: 'ix-create-data-wizard-step',
  templateUrl: './create-data-wizard-step.component.html',
  styleUrls: ['./create-data-wizard-step.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateDataWizardStepComponent implements OnInit {
  @Input() form: PoolManagerWizardComponent['form']['controls']['data'];

  unusedDisks: UnusedDisk[] = [];
  sizeDisksMap: SizeDisksMap = { hdd: {}, ssd: {} };

  vdevLayoutOptions$ = of([
    { label: 'Stripe', value: CreateVdevLayout.Stripe },
  ]);

  diskSizeOptions$ = of([]);
  widthOptions$ = of([]);
  numberOptions$ = of([]);

  constructor(
    private poolManagerStore: PoolManagerStore,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.poolManagerStore.unusedDisks$.pipe(untilDestroyed(this)).subscribe((disks) => {
      this.unusedDisks = disks;
      this.updateDiskSizeOptions();
      this.cdr.markForCheck();
    });

    this.form.controls.size_and_type.valueChanges.pipe(untilDestroyed(this)).subscribe(([size, type]) => {
      if (type === DiskType.Hdd) {
        this.updateWidthOptions(this.sizeDisksMap.hdd[size]);
      } else {
        this.updateWidthOptions(this.sizeDisksMap.ssd[size]);
      }
    });

    this.form.controls.width.valueChanges.pipe(untilDestroyed(this)).subscribe((selectedWidth) => {
      this.updateNumberOptions(selectedWidth);
    });
  }

  updateDiskSizeOptions(): void {
    this.form.controls.size_and_type.setValue([null, null]);
    this.sizeDisksMap = {
      hdd: getSizeDisksMap(this.unusedDisks.filter((disk) => disk.type === DiskType.Hdd)),
      ssd: getSizeDisksMap(this.unusedDisks.filter((disk) => disk.type === DiskType.Ssd)),
    };

    const hddOptions = Object.keys(this.sizeDisksMap.hdd).map((size) => ({
      label: `${filesize(Number(size), { standard: 'iec' })} (${DiskType.Hdd})`,
      value: [size, DiskType.Hdd],
    }));

    const ssdOptions = Object.keys(this.sizeDisksMap.ssd).map((size) => ({
      label: `${filesize(Number(size), { standard: 'iec' })} (${DiskType.Ssd})`,
      value: [size, DiskType.Ssd],
    }));

    this.diskSizeOptions$ = of(hddOptions.concat(ssdOptions));
  }

  updateWidthOptions(length: number): void {
    this.form.controls.width.setValue(null);
    if (length) {
      // eslint-disable-next-line sonarjs/no-small-switch
      switch (this.form.value.type) {
        case CreateVdevLayout.Stripe:
          this.widthOptions$ = of(
            _.range(1, length + 1).map((item) => ({
              label: item,
              value: item,
            })),
          );
        // TODO: Add other cases
      }
      this.form.controls.width.setValue(length);
    } else {
      this.widthOptions$ = of([]);
    }
  }

  updateNumberOptions(width: number): void {
    this.form.controls.number.setValue(null);
    if (width) {
      // eslint-disable-next-line sonarjs/no-small-switch
      switch (this.form.value.type) {
        case CreateVdevLayout.Stripe:
          this.numberOptions$ = of(
            _.range(1, width + 1).map((item) => ({
              label: item,
              value: item,
            })),
          );
        // TODO: Add other cases
      }
      this.form.controls.number.setValue(width);
    } else {
      this.numberOptions$ = of([]);
    }
  }
}
