import { ChangeDetectionStrategy, Component, OnInit, input, output, inject, OnChanges } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import { map } from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { redundantListToUniqueOptions } from 'app/helpers/operators/options.operators';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import {
  ManualDiskSelectionStore,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';

export type ManualDiskSelectionFilters = ManualSelectionDiskFiltersComponent['filterForm']['value'];

@UntilDestroy()
@Component({
  selector: 'ix-manual-selection-disk-filters',
  templateUrl: './manual-selection-disk-filters.component.html',
  styleUrls: ['./manual-selection-disk-filters.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    TranslateModule,
  ],
})
export class ManualSelectionDiskFiltersComponent implements OnInit, OnChanges {
  private formBuilder = inject(FormBuilder);
  store$ = inject(ManualDiskSelectionStore);

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

  ngOnChanges(): void {
    this.updateSedFilter();
  }

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(untilDestroyed(this))
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

  protected readonly iconMarker = iconMarker;
}
