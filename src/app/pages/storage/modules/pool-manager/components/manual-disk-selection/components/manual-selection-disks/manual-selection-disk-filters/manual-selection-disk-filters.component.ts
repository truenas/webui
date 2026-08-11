import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, input, output, inject, OnChanges } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnCheckboxComponent, TnFormFieldComponent, TnInputComponent, TnSelectComponent, tnIconMarker,
} from '@truenas/ui-components';
import { uniq } from 'lodash-es';
import { map } from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { redundantListToUniqueOptions } from 'app/helpers/operators/options.operators';
import { tnSelectLabels } from 'app/modules/forms/ix-forms/constants/tn-select-labels.constant';
import { optionTestIdByLabel } from 'app/modules/forms/ix-forms/constants/tn-select-option-test-id.constant';
import {
  ManualDiskSelectionStore,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';

export type ManualDiskSelectionFilters = ManualSelectionDiskFiltersComponent['filterForm']['value'];

@Component({
  selector: 'ix-manual-selection-disk-filters',
  templateUrl: './manual-selection-disk-filters.component.html',
  styleUrls: ['./manual-selection-disk-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    ReactiveFormsModule,
    TnFormFieldComponent,
    TnInputComponent,
    TnSelectComponent,
    TnCheckboxComponent,
    TranslateModule,
  ],
})
export class ManualSelectionDiskFiltersComponent implements OnInit, OnChanges {
  private formBuilder = inject(FormBuilder);
  store$ = inject(ManualDiskSelectionStore);
  private destroyRef = inject(DestroyRef);

  protected readonly tnSelectLabels = tnSelectLabels;

  readonly isSedEncryption = input<boolean>(false);
  readonly filtersUpdated = output<ManualDiskSelectionFilters>();

  protected filterForm = this.formBuilder.group({
    search: [''],
    diskType: ['' as DiskType],
    diskSize: [''],
    sedCapable: [false],
  });

  readonly typeOptions$ = this.store$.inventory$.pipe(
    map((disks) => disks.map((disk) => disk.type)),
    redundantListToUniqueOptions(),
  );

  readonly sizeOptions$ = this.store$.inventory$.pipe(
    map((disks) => {
      const diskSizes = disks.toSorted((a, b) => a.size - b.size).map((disk) => disk.size);
      const sizeLabels = diskSizes.map((size) => buildNormalizedFileSize(size));
      const uniqueLabels = uniq(sizeLabels);
      return uniqueLabels.map((size: string) => ({ label: size, value: size }));
    }),
  );

  protected readonly optionTestIdByLabel = optionTestIdByLabel;

  ngOnChanges(): void {
    this.updateSedFilter();
  }

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        this.filtersUpdated.emit(value);
      });

    // Initialize SED filter based on encryption type
    this.updateSedFilter();
  }

  private updateSedFilter(): void {
    if (this.isSedEncryption()) {
      this.filterForm.controls.sedCapable.setValue(true);
      this.filterForm.controls.sedCapable.disable();
    } else {
      this.filterForm.controls.sedCapable.enable();
    }
  }

  protected readonly tnIconMarker = tnIconMarker;
}
