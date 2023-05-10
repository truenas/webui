import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import _ from 'lodash';
import {
  Observable,
  combineLatest,
  filter,
  map,
  of, switchMap, take, takeWhile,
} from 'rxjs';
import { DiskType } from 'app/enums/disk-type.enum';
import { CreateVdevLayout } from 'app/enums/v-dev-type.enum';
import helptext from 'app/helptext/storage/volumes/manager/manager';
import { RadioOption, SelectOption } from 'app/interfaces/option.interface';
import {
  ManualDiskSelectionComponent, ManualDiskSelectionLayout,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/manual-disk-selection.component';
import { PoolManagerWizardComponent } from 'app/pages/storage/modules/pool-manager/components/pool-manager-wizard/pool-manager-wizard.component';
import { SizeAndType } from 'app/pages/storage/modules/pool-manager/interfaces/size-and-type.interface';
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

  protected minDisks: { [key: string]: number } = {
    [CreateVdevLayout.Stripe]: 1,
    [CreateVdevLayout.Mirror]: 2,
    [CreateVdevLayout.Raidz1]: 3,
    [CreateVdevLayout.Raidz2]: 4,
    [CreateVdevLayout.Raidz3]: 5,
  };

  readonly manualDiskSelectionMessage = helptext.manual_disk_selection_message;
  sizeDisksMap: SizeDisksMap = { [DiskType.Hdd]: {}, [DiskType.Ssd]: {} };

  selectedDiskType: DiskType = null;
  selectedSize: string = null;
  selectedWidth: number = null;
  selectedVdevsCount: number = null;

  vdevLayoutOptions$: Observable<SelectOption<CreateVdevLayout>[]> = of([
    { label: 'Stripe', value: CreateVdevLayout.Stripe },
  ]);

  widthOptions$: Observable<SelectOption[]> = of([]);
  numberOptions$: Observable<SelectOption[]> = of([]);
  readonly diskSizeAndTypeOptions$ = this.poolManagerStore.inventory$.pipe(
    filter(Boolean),
    map((disks) => {
      return _.uniqBy(disks, (disk) => `${disk.size} ${disk.type}`)
        .map((disk): SelectOption<SizeAndType> => ({
          label: `${disk.capacity} (${disk.type})`,
          value: [disk.size.toString(), disk.type],
        }));
    }),
  );

  readonly totalUsableCapacity$ = this.poolManagerStore.totalUsableCapacity$;
  readonly dispersalOptions$: Observable<RadioOption[]> = of([
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
    this.poolManagerStore.inventory$.pipe(
      takeWhile((unusedDisks) => {
        return !unusedDisks?.length;
      }, true),
      untilDestroyed(this),
    ).subscribe((disks) => {
      this.sizeDisksMap = {
        [DiskType.Hdd]: getSizeDisksMap(disks.filter((disk) => disk.type === DiskType.Hdd)),
        [DiskType.Ssd]: getSizeDisksMap(disks.filter((disk) => disk.type === DiskType.Ssd)),
      };
      const vdevLayoutOptions = [];
      for (const [key, value] of Object.entries(CreateVdevLayout)) {
        if (disks.length >= this.minDisks[value]) {
          vdevLayoutOptions.push({ label: key, value });
        }
      }
      this.form.controls.type.setValue(vdevLayoutOptions[vdevLayoutOptions.length - 1]?.value);
      this.vdevLayoutOptions$ = of(vdevLayoutOptions);
      this.cdr.markForCheck();
    });

    combineLatest([
      this.form.controls.type.valueChanges,
      this.form.controls.sizeAndType.valueChanges,
    ]).pipe(untilDestroyed(this)).subscribe(([, [size, diskType]]) => {
      this.selectedDiskType = diskType;
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
      vdevType: this.form.controls.type.value,
      width: this.selectedWidth,
      count: this.selectedVdevsCount,
    });
  }

  updateWidthOptions(): void {
    if (!this.selectedDiskType || !this.selectedSize) {
      return;
    }
    const length: number = this.sizeDisksMap[this.selectedDiskType][this.selectedSize];
    const minRequired = this.minDisks[this.form.controls.type.value as CreateVdevLayout];

    if (length && minRequired) {
      this.widthOptions$ = of(
        _.range(minRequired, length + 1).map((item) => ({
          label: `${item}`,
          value: item,
        })),
      );
      this.form.controls.width.setValue(length);
    } else {
      this.widthOptions$ = of([]);
      this.form.controls.width.setValue(null);
    }
  }

  updateNumberOptions(width: number): void {
    if (!this.selectedDiskType || !this.selectedSize) {
      return;
    }

    const length = this.sizeDisksMap[this.selectedDiskType][this.selectedSize];
    let nextNumberOptions: SelectOption[] = [];

    if (width) {
      const maxNumber = Math.floor(length / width);
      nextNumberOptions = Array.from({ length: maxNumber }).map((value, index) => ({
        label: `${index + 1}`,
        value: index + 1,
      }));
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
      vdevType: this.form.controls.type.value,
      count: this.selectedVdevsCount,
      size: +this.selectedSize,
    });
  }
}
