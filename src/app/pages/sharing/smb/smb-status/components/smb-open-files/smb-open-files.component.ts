import {
  ChangeDetectionStrategy, Component, Input, OnChanges,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { SmbLockInfo, SmbOpenInfo } from 'app/interfaces/smb-status.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';

@Component({
  selector: 'ix-smb-open-files',
  templateUrl: './smb-open-files.component.html',
  styleUrls: ['./smb-open-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmbOpenFilesComponent implements OnChanges {
  @Input() lock: SmbLockInfo;

  get files(): SmbOpenInfo[] {
    return Object.values(this.lock?.opens || []);
  }

  dataProvider: AsyncDataProvider<SmbOpenInfo>;
  columns = createTable<SmbOpenInfo>([
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
    rowTestId: (row) => 'smb-open-file-' + row.uid.toString(),
  });

  constructor(
    private translate: TranslateService,
    protected emptyService: EmptyService,
  ) {}

  createProvider(): void {
    this.dataProvider = new AsyncDataProvider(of(this.files));
    this.dataProvider.load();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.lock.firstChange || changes.lock.currentValue !== changes.lock.previousValue) {
      this.createProvider();
    }
  }
}
