import {
  ChangeDetectionStrategy, Component, computed, input, OnChanges, inject, signal,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCardComponent, TnCardHeaderDirective, TnCellDefDirective, TnHeaderCellDefDirective, TnTableColumnDirective,
  TnTableComponent, TnTablePagerComponent,
  TnTestIdDirective,
} from '@truenas/ui-components';
import { kebabCase } from 'lodash-es';
import { of, switchMap } from 'rxjs';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { SmbLockInfo, SmbOpenInfo } from 'app/interfaces/smb-status.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  convertStringToId, createTable, dataProviderLoading, dataProviderRows, toDisplayedColumns,
} from 'app/modules/ix-table/utils';

@Component({
  selector: 'ix-smb-open-files',
  templateUrl: './smb-open-files.component.html',
  styleUrls: ['./smb-open-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnTestIdDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnTablePagerComponent,
    TranslateModule,
  ],
})
export class SmbOpenFilesComponent implements OnChanges {
  private translate = inject(TranslateService);
  protected emptyService = inject(EmptyService);

  lock = input<SmbLockInfo>();
  files = computed<SmbOpenInfo[]>(() => {
    return Object.values(this.lock()?.opens || []);
  });

  // The provider is rebuilt whenever the lock input changes, so it is held in a
  // signal and adapted via the Signal<provider> helper overload (see target-list).
  dataProvider = signal(new AsyncDataProvider<SmbOpenInfo>(of([] as SmbOpenInfo[])));
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
  protected readonly emptyType = toSignal(
    toObservable(this.dataProvider).pipe(switchMap((provider) => provider.emptyType$)),
  );

  protected readonly columns = signal(createTable<SmbOpenInfo>([
    textColumn({
      title: this.translate.instant('Server'),
      propertyName: 'server_id',
      getValue: (row) => {
        return Object.values(row.server_id).join(':');
      },
    }),
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'uid',
      getValue: (row) => {
        return `${row.username} (${row.uid})`;
      },
    }),
    textColumn({ title: this.translate.instant('Opened at'), propertyName: 'opened_at' }),
  ], {
    uniqueRowTag: (row) => `smb-open-file-${row.username}-${row.uid}`,
    ariaLabels: (row) => [row.username, this.translate.instant('SMB Open File')],
  }));

  protected readonly displayedColumns = computed(() => toDisplayedColumns(this.columns()));

  protected readonly trackByOpenFile = (_index: number, row: SmbOpenInfo): string => {
    return `${row.username}-${row.uid}`;
  };

  protected formatServer(row: SmbOpenInfo): string {
    return Object.values(row.server_id).join(':');
  }

  protected formatUsername(row: SmbOpenInfo): string {
    return `${row.username} (${row.uid})`;
  }

  protected uniqueRowTag(row: SmbOpenInfo): string {
    // Pre-split with lodash kebabCase so digit-bearing values resolve identically through
    // the legacy [ixTest] directive and the library [tnTestId] directive (see nfs-list).
    return kebabCase(convertStringToId(`smb-open-file-${row.username}-${row.uid}`));
  }

  private createProvider(): void {
    const provider = new AsyncDataProvider(of(this.files()));
    this.dataProvider.set(provider);
    provider.load();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.lock.firstChange || changes.lock.currentValue !== changes.lock.previousValue) {
      this.createProvider();
    }
  }
}
