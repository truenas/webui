import { map, Observable } from 'rxjs';
import { VdevType } from 'app/enums/v-dev-type.enum';
import { buildNormalizedFileSize } from 'app/helpers/file-size.utils';
import { Option } from 'app/interfaces/option.interface';
import { IxComboboxProvider } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox-provider';
import { PoolManagerStore } from 'app/pages/storage/modules/pool-manager/store/pool-manager.store';

export class SpareDiskComboboxProvider implements IxComboboxProvider {
  protected page = 1;
  protected readonly pageSize = 7;

  fetch(filterValue: string): Observable<Option[]> {
    this.page = 0;
    return this.getFilteredDisks(filterValue);
  }

  constructor(
    private store: PoolManagerStore,
  ) {
  }

  nextPage(filterValue: string): Observable<Option[]> {
    this.page++;
    return this.getFilteredDisks(filterValue);
  }

  getFilteredDisks(filterValue: string): Observable<Option[]> {
    return this.store.getInventoryForStep(VdevType.Spare).pipe(
      map((disks) => {
        const offset = this.page * this.pageSize;
        const end = offset + this.pageSize < disks.length
          ? offset + this.pageSize
          : disks.length;
        return disks.filter(
          (disk) => {
            const cleanFilter = filterValue.toLowerCase().trim();
            return disk.name.includes(cleanFilter)
              || disk.type.includes(cleanFilter)
              || (buildNormalizedFileSize(disk.size)).includes(cleanFilter);
          },
        ).map(
          (disk) => {
            return {
              label: `${disk.name} - ${disk.type} (${buildNormalizedFileSize(disk.size)})`,
              value: disk.name,
            } as Option;
          },
        ).slice(offset, end);
      }),
    );
  }
}
