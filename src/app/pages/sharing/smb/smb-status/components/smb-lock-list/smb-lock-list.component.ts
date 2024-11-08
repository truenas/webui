import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { tap } from 'rxjs';
import { SmbInfoLevel } from 'app/enums/smb-info-level.enum';
import { SmbLockInfo, SmbOpenInfo } from 'app/interfaces/smb-status.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableDetailsRowDirective } from 'app/modules/ix-table/directives/ix-table-details-row.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { SmbOpenFilesComponent } from 'app/pages/sharing/smb/smb-status/components/smb-open-files/smb-open-files.component';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-smb-lock-list',
  templateUrl: './smb-lock-list.component.html',
  styleUrls: ['./smb-lock-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatToolbarRow,
    SearchInput1Component,
    IxTableColumnsSelectorComponent,
    MatButton,
    TestDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableDetailsRowDirective,
    SmbOpenFilesComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SmbLockListComponent implements OnInit {
  filterString = '';
  dataProvider: AsyncDataProvider<SmbLockInfo>;
  locks: SmbLockInfo[] = [];
  files: SmbOpenInfo[] = [];
  columns = createTable<SmbLockInfo>([
    textColumn({ title: this.translate.instant('Path'), propertyName: 'service_path' }),
    textColumn({ title: this.translate.instant('Filename'), propertyName: 'filename' }),
    textColumn({
      title: this.translate.instant('File ID'),
      propertyName: 'fileid',
      getValue: (row) => {
        return Object.values(row.fileid).join(':');
      },
    }),
    textColumn({
      title: this.translate.instant('Open Files'),
      propertyName: 'opens',
      getValue: (row) => {
        return this.translate.instant('{n, plural, =0 {No open files} one {# open file} other {# open files}}', { n: Object.keys(row.opens).length });
      },
    }),
    textColumn({
      title: this.translate.instant('Num Pending Deletes'),
      propertyName: 'num_pending_deletes',
    }),
  ], {
    uniqueRowTag: (row) => `smb-lock-${row.filename}-${row.fileid.devid}-${row.fileid.extid}`,
    ariaLabels: (row) => [row.filename, this.translate.instant('SMB Lock')],
  });

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const smbStatus$ = this.ws.call('smb.status', [SmbInfoLevel.Locks]).pipe(
      tap((locks: SmbLockInfo[]) => {
        this.locks = locks;
        if (this.filterString) {
          this.onListFiltered(this.filterString);
        }
      }),
      untilDestroyed(this),
    );

    this.dataProvider = new AsyncDataProvider(smbStatus$);
    this.loadData();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  loadData(): void {
    this.dataProvider.load();
  }

  onListFiltered(query: string): void {
    this.filterString = query?.toString()?.toLowerCase();
    this.dataProvider.setFilter({ query, columnKeys: ['filename', 'service_path'] });
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
