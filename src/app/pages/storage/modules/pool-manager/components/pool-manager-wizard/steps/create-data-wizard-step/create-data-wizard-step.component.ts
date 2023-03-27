import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import _ from 'lodash';
import { of } from 'rxjs';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  ManualDiskSelectionComponent, ManualDiskSelectionLayout,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
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

  readonly dispersalOptions$ = of([
    {
      label: this.translate.instant('Minimize Enclosure Dispersal'),
      value: true,
    },
    {
      label: this.translate.instant('Maximize Enclosure Dispersal'),
      value: false,
    },
  ]);

  constructor(
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
    private translate: TranslateService,
    public store: PoolManagerStore,
  ) {}

  ngOnInit(): void {
    this.store.unusedDisks$.pipe(untilDestroyed(this)).subscribe((disks) => {
      this.unusedDisks = disks;
      this.updateDiskSizeOptions();
      this.cdr.markForCheck();
    });

    this.form.controls.sizeAndType.valueChanges.pipe(untilDestroyed(this)).subscribe(([size, type]) => {
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
    this.form.controls.sizeAndType.setValue([null, null]);
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
    this.form.controls.vdevsNumber.setValue(null);
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
      this.form.controls.vdevsNumber.setValue(width);
    } else {
      this.numberOptions$ = of([]);
    }
  }

  openManualDiskSelection(): void {
    // TODO: Take current form settings, convert to layout and pass into a dialog.
    // TODO: Extract logic somewhere, plan for multiple layout types (Stripe, Mirror, etc), and different options
    // TODO: such as different enclosure dispersal and treat disk size as minimum.
    // TODO: Also keep in mind that user set custom layout in dialog, save and then press this button again.

    this.dialog.open(ManualDiskSelectionComponent, {
      data: {
        type: this.form.controls.type.value,
      } as ManualDiskSelectionLayout,
      panelClass: 'manual-selection-dialog',
    });
  }
}
