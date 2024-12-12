import {
  ChangeDetectionStrategy, Component, OnInit, output,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { uniq } from 'lodash-es';
import { map } from 'rxjs/operators';
import { DiskType } from 'app/enums/disk-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { redundantListToUniqueOptions } from 'app/helpers/operators/options.operators';
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
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IxInputComponent,
    IxSelectComponent,
    TranslateModule,
  ],
})
export class ManualSelectionDiskFiltersComponent implements OnInit {
  readonly filtersUpdated = output<ManualDiskSelectionFilters>();

  protected filterForm = this.formBuilder.group({
    search: [''],
    diskType: ['' as DiskType],
    diskSize: [''],
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

  constructor(
    private formBuilder: FormBuilder,
    public store$: ManualDiskSelectionStore,
  ) {}

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        this.filtersUpdated.emit(value);
      });
  }

  protected readonly iconMarker = iconMarker;
}
