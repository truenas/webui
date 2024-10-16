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
import { SmbSession } from 'app/interfaces/smb-status.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-smb-session-list',
  templateUrl: './smb-session-list.component.html',
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
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SmbSessionListComponent implements OnInit {
  filterString = '';
  dataProvider: AsyncDataProvider<SmbSession>;
  sessions: SmbSession[] = [];

  columns = createTable<SmbSession>([
    textColumn({ title: this.translate.instant('Session ID'), propertyName: 'session_id' }),
    textColumn({ title: this.translate.instant('Hostname'), propertyName: 'hostname' }),
    textColumn({ title: this.translate.instant('Remote machine'), propertyName: 'remote_machine' }),
    textColumn({ title: this.translate.instant('Username'), propertyName: 'username' }),
    textColumn({ title: this.translate.instant('Groupname'), propertyName: 'groupname' }),
    textColumn({ title: this.translate.instant('UID'), propertyName: 'uid' }),
    textColumn({ title: this.translate.instant('GID'), propertyName: 'gid' }),
    textColumn({ title: this.translate.instant('Session dialect'), propertyName: 'session_dialect' }),
    textColumn({
      title: this.translate.instant('Encryption'),
      propertyName: 'encryption',
      getValue: (row) => row.encryption.cipher,
    }),
    textColumn({
      title: this.translate.instant('Signing'),
      propertyName: 'signing',
      getValue: (row) => row.signing.cipher,
    }),
  ], {
    uniqueRowTag: (row) => 'smb-session-' + row.session_id,
    ariaLabels: (row) => [row.hostname, this.translate.instant('SMB Session')],
  });

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const smbStatus$ = this.ws.call('smb.status', [SmbInfoLevel.Sessions]).pipe(
      tap((sessions: SmbSession[]) => {
        this.sessions = sessions;
        if (this.filterString) {
          this.onListFiltered(this.filterString);
        }
      }),
      untilDestroyed(this),
    );

    this.dataProvider = new AsyncDataProvider<SmbSession>(smbStatus$);
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
    this.dataProvider.setFilter({
      query,
      columnKeys: ['server_id', 'hostname', 'remote_machine', 'username', 'groupname', 'uid', 'gid', 'session_dialect'],
    });
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
