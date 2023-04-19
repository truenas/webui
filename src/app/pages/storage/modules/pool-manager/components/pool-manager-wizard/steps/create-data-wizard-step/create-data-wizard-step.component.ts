import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import filesize from 'filesize';
import _ from 'lodash';
import {
  Observable,
  filter,
  of, switchMap, take, takeWhile,
} from 'rxjs';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { SelectOption } from 'app/interfaces/option.interface';
import { UnusedDisk } from 'app/interfaces/storage.interface';
import {
  ManualDiskSelectionComponent, ManualDiskSelectionLayout,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { SizeDisksMap } from 'app/pages/storage/modules/pool-manager/interfaces/size-disks-map.interface';
import { ManualDiskSelectionState, ManualDiskSelectionStore } from 'app/pages/storage/modules/pool-manager/store/manual-disk-selection-store.service';
import { PoolManagerState, PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pools-manager-store.service';
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

  readonly manualDiskSelectionMessage = helptext.manual_disk_selection_message;
  unusedDisks: UnusedDisk[] = [];
  sizeDisksMap: SizeDisksMap = { [DiskType.Hdd]: {}, [DiskType.Ssd]: {} };

  selectedDiskType: DiskType = null;
  selectedSize: string = null;
  selectedWidth: number = null;
  selectedVdevsCount: number = null;

  vdevLayoutOptions$ = of([
    { label: 'Stripe', value: CreateVdevLayout.Stripe },
  ]);

  diskSizeAndTypeOptions$: Observable<SelectOption[]> = of([]);
  widthOptions$: Observable<SelectOption[]> = of([]);
  numberOptions$: Observable<SelectOption[]> = of([]);

  readonly vdevsCountString$ = this.poolManagerStore.vdevsCountString$;
  readonly totalUsableCapacity$ = this.poolManagerStore.totalUsableCapacity$;
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
    public poolManagerStore: PoolManagerStore,
    private manualDiskSelectionStore: ManualDiskSelectionStore,
  ) {}

  ngOnInit(): void {
    this.poolManagerStore.unusedDisks$.pipe(
      takeWhile((unusedDisks) => {
        return !unusedDisks?.length;
      }, true),
      untilDestroyed(this),
    ).subscribe((disks) => {
      this.unusedDisks = disks;
      this.updateDiskSizeOptions();
      this.cdr.markForCheck();
    });

    this.form.controls.sizeAndType.valueChanges.pipe(untilDestroyed(this)).subscribe(([size, type]) => {
      this.selectedDiskType = type;
      this.selectedSize = size;
      this.updateWidthOptions();
      this.createVdevsAutomatically();
    });

    this.form.controls.width.valueChanges.pipe(untilDestroyed(this)).subscribe((selectedWidth) => {
      this.selectedWidth = selectedWidth;
      this.updateNumberOptions(selectedWidth);
      this.createVdevsAutomatically();
    });

    this.form.controls.vdevsNumber.valueChanges.pipe(untilDestroyed(this)).subscribe((vdevNumber) => {
      this.selectedVdevsCount = vdevNumber;
      this.createVdevsAutomatically();
    });
  }

  createVdevsAutomatically(): void {
    this.poolManagerStore.createDataVdevsAutomatically({
      size: +this.selectedSize,
      type: this.selectedDiskType,
      width: this.selectedWidth,
      count: this.selectedVdevsCount,
    });
  }

  updateDiskSizeOptions(): void {
    this.form.controls.sizeAndType.setValue([null, null]);

    this.sizeDisksMap = {
      [DiskType.Hdd]: getSizeDisksMap(this.unusedDisks.filter((disk) => disk.type === DiskType.Hdd)),
      [DiskType.Ssd]: getSizeDisksMap(this.unusedDisks.filter((disk) => disk.type === DiskType.Ssd)),
    };

    // TODO: Fix this. Value as an array does not support in SelectOption.
    const hddOptions = Object.keys(this.sizeDisksMap[DiskType.Hdd]).map((size) => ({
      label: `${filesize(Number(size), { standard: 'iec' })} (${DiskType.Hdd})`,
      value: [size, DiskType.Hdd],
    })) as unknown as SelectOption[];

    // TODO: Fix this. Value as an array does not support in SelectOption.
    const ssdOptions = Object.keys(this.sizeDisksMap[DiskType.Ssd]).map((size) => ({
      label: `${filesize(Number(size), { standard: 'iec' })} (${DiskType.Ssd})`,
      value: [size, DiskType.Ssd],
    })) as unknown as SelectOption[];

    this.diskSizeAndTypeOptions$ = of([...hddOptions, ...ssdOptions]);
  }

  updateWidthOptions(): void {
    if (!this.selectedDiskType || !this.selectedSize) {
      return;
    }
    const length: number = this.sizeDisksMap[this.selectedDiskType][this.selectedSize];

    if (length) {
      switch (this.form.value.type) {
        case CreateVdevLayout.Stripe:
          this.widthOptions$ = of(
            _.range(1, length + 1).map((item) => ({
              label: `${item}`,
              value: item,
            })),
          );
          break;
        case CreateVdevLayout.Mirror:
        case CreateVdevLayout.Raidz1:
        case CreateVdevLayout.Raidz2:
        case CreateVdevLayout.Raidz3:
          break;
      }
      this.form.controls.width.setValue(length);
    } else {
      this.widthOptions$ = of([]);
      this.form.controls.width.setValue(null);
    }
  }

  updateNumberOptions(width: number): void {
    const length: number = this.selectedDiskType === DiskType.Hdd
      ? this.sizeDisksMap[DiskType.Hdd][this.selectedSize]
      : this.sizeDisksMap[DiskType.Ssd][this.selectedSize];
    let nextNumberOptions: SelectOption[] = [];

    if (width) {
      const maxNumber = Math.floor(length / width);
      switch (this.form.value.type) {
        case CreateVdevLayout.Stripe:
          nextNumberOptions = Array.from({ length: maxNumber }).map((value, index) => ({
            label: `${index + 1}`,
            value: index + 1,
          }));
          break;
        case CreateVdevLayout.Mirror:
        case CreateVdevLayout.Raidz1:
        case CreateVdevLayout.Raidz2:
        case CreateVdevLayout.Raidz3:
          break;
      }
      this.form.controls.vdevsNumber.setValue(maxNumber);
    } else {
      this.form.controls.vdevsNumber.setValue(null);
    }
    this.numberOptions$ = of(nextNumberOptions);
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
    })
      .afterClosed()
      .pipe(
        filter(Boolean),
        switchMap(() => this.manualDiskSelectionStore.state$),
        take(1),
        untilDestroyed(this),
      )
      .subscribe((manualDiskSelectionState: ManualDiskSelectionState) => {
        this.poolManagerStore.patchState((state: PoolManagerState) => {
          const hasAtleastOneVdevWithDisks = !!manualDiskSelectionState.vdevs.data?.length
          && !!manualDiskSelectionState.vdevs.data.some((vdev) => vdev.disks?.length);
          return {
            ...state,
            vdevs: hasAtleastOneVdevWithDisks
              ? { ...state.vdevs, data: manualDiskSelectionState.vdevs.data }
              : { ...state.vdevs, data: [] },
            unusedDisks: manualDiskSelectionState.unusedDisks,
            disksSelectedManually: hasAtleastOneVdevWithDisks && manualDiskSelectionState.selectionChanged,
          };
        });
      });
  }

  resetLayout(): void {
    this.poolManagerStore.resetLayout();
    if (!this.selectedWidth || !this.selectedDiskType || !this.selectedVdevsCount || !this.selectedSize) {
      return;
    }
    this.poolManagerStore.createDataVdevsAutomatically({
      width: this.selectedWidth,
      type: this.selectedDiskType,
      count: this.selectedVdevsCount,
      size: +this.selectedSize,
    });
  }
}
