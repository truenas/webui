import {
  ChangeDetectionStrategy, Component, EventEmitter, OnInit, Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import { FileSizePipe } from 'ngx-filesize';
import { map } from 'rxjs/operators';
import { redundantListToUniqueOptions } from 'app/helpers/operators/options.operators';
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
})
export class ManualSelectionDiskFiltersComponent implements OnInit {
  @Output() filtersUpdated = new EventEmitter<ManualDiskSelectionFilters>();

  protected filterForm = this.formBuilder.group({
    search: [''],
    diskType: [''],
    diskSize: [''],
  });

  readonly typeOptions$ = this.store$.inventory$.pipe(
    map((disks) => disks.map((disk) => disk.type)),
    redundantListToUniqueOptions(),
  );

  readonly sizeOptions$ = this.store$.inventory$.pipe(
    map((disks) => {
      const diskSizes = disks.sort((a, b) => a.size - b.size).map((disk) => disk.size);
      const sizeLabels = diskSizes.map((size) => this.filesizePipe.transform(size, { standard: 'iec' }));
      const uniqueLabels = _.uniq(sizeLabels);
      return uniqueLabels.map((size: string) => ({ label: size, value: size }));
    }),
  );

  constructor(
    private formBuilder: FormBuilder,
    private filesizePipe: FileSizePipe,
    public store$: ManualDiskSelectionStore,
  ) {}

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((value) => {
        this.filtersUpdated.emit(value);
      });
  }
}
