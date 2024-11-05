import { NgTemplateOutlet, AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatButtonToggleChange, MatButtonToggleGroup, MatButtonToggle } from '@angular/material/button-toggle';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { combineLatest, map, tap } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { stringToTitleCase } from 'app/helpers/string-to-title-case';
import { Nfs3Session, Nfs4Session, NfsType } from 'app/interfaces/nfs-share.interface';
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
import { Column, ColumnComponent } from 'app/modules/ix-table/interfaces/column-component.class';
import { createTable } from 'app/modules/ix-table/utils';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { nfsSessionListElements } from 'app/pages/sharing/nfs/nfs-session-list/nfs-session-list.elements';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-nfs-session-list',
  templateUrl: './nfs-session-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    MatButtonToggleGroup,
    MatButtonToggle,
    SearchInput1Component,
    NgTemplateOutlet,
    MatButton,
    TestDirective,
    IxTableColumnsSelectorComponent,
    IxTableComponent,
    UiSearchDirective,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class NfsSessionListComponent implements OnInit {
  protected readonly activeNfsType = signal<NfsType>(NfsType.Nfs3);
  protected readonly searchableElements = nfsSessionListElements;

  filterString = '';
  sessions: Nfs3Session[] | Nfs4Session['info'][] = [];
  readonly NfsType = NfsType;

  nfs3Columns = createTable<Nfs3Session>([
    textColumn({
      title: this.translate.instant('IP'),
      propertyName: 'ip',
    }),
    textColumn({
      title: this.translate.instant('Export'),
      propertyName: 'export',
    }),
  ], {
    uniqueRowTag: (row) => 'nfs3-session-' + row.export + '-' + row.ip,
    ariaLabels: (row) => [row.ip, this.translate.instant('NFS3 Session')],
  });

  nfs4Columns = createTable<Nfs4Session['info']>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Client ID'),
      propertyName: 'clientid',
    }),
    textColumn({
      title: this.translate.instant('Address'),
      propertyName: 'address',
    }),
    textColumn({
      title: this.translate.instant('Status'),
      propertyName: 'status',
      getValue: (row) => stringToTitleCase(row.status),
    }),
    textColumn({
      title: this.translate.instant('Seconds From Last Renew'),
      propertyName: 'seconds from last renew',
    }),
    textColumn({
      title: this.translate.instant('Minor Version'),
      propertyName: 'minor version',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Implementation Domain'),
      hidden: true,
      propertyName: 'Implementation domain',
    }),
    textColumn({
      title: this.translate.instant('Implementation Name'),
      hidden: true,
      propertyName: 'Implementation name',
    }),
    textColumn({
      title: this.translate.instant('Callback State'),
      hidden: true,
      propertyName: 'callback state',
    }),
    textColumn({
      title: this.translate.instant('Callback Address'),
      propertyName: 'callback address',
      hidden: true,
    }),
  ], {
    uniqueRowTag: (row) => `nfs4-session-${row.address}-${row.clientid}`,
    ariaLabels: (row) => [row.name, this.translate.instant('NFS4 Session')],
  });

  nfs3ProviderRequest$ = this.ws.call('nfs.get_nfs3_clients', []).pipe(
    tap((sessions) => {
      this.sessions = sessions;
      if (this.filterString) {
        this.onListFiltered(this.filterString);
      }
    }),
    untilDestroyed(this),
  );

  nfs3DataProvider = new AsyncDataProvider<Nfs3Session>(this.nfs3ProviderRequest$);

  nfs4ProviderRequest$ = this.ws.call('nfs.get_nfs4_clients', []).pipe(
    map((sessions) => sessions.map((session) => session.info)),
    tap((sessions) => {
      this.sessions = sessions;
      if (this.filterString) {
        this.onListFiltered(this.filterString);
      }
    }),
    untilDestroyed(this),
  );

  nfs4DataProvider = new AsyncDataProvider<Nfs4Session['info']>(this.nfs4ProviderRequest$);

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    this.loadData();

    combineLatest([this.nfs3DataProvider.emptyType$, this.nfs4DataProvider.emptyType$])
      .pipe(untilDestroyed(this)).subscribe(() => {
        this.onListFiltered(this.filterString);
      });
  }

  nfsTypeChanged(changedValue: MatButtonToggleChange): void {
    if (this.activeNfsType() === changedValue.value) {
      return;
    }

    if (this.activeNfsType() === NfsType.Nfs3 && changedValue.value === NfsType.Nfs4) {
      this.activeNfsType.set(NfsType.Nfs4);
      this.loadData();
    } else {
      this.activeNfsType.set(NfsType.Nfs3);
      this.loadData();
    }
  }

  loadData(): void {
    if (this.activeNfsType() === NfsType.Nfs3) {
      this.nfs3DataProvider.load();
    } else {
      this.nfs4DataProvider.load();
    }
  }

  onListFiltered(query: string): void {
    this.filterString = query?.toString()?.toLowerCase();

    if (this.activeNfsType() === NfsType.Nfs3) {
      this.filterNfs3Data();
    } else {
      this.filterNfs4Data();
    }
  }

  columnsChange(columns: unknown): void {
    if (this.activeNfsType() === NfsType.Nfs3) {
      this.nfs3Columns = [...columns as Column<Nfs3Session, ColumnComponent<Nfs3Session>>[]];
    } else {
      this.nfs4Columns = [...columns as Column<Nfs4Session['info'], ColumnComponent<Nfs4Session['info']>>[]];
    }

    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private filterNfs3Data(): void {
    this.nfs3DataProvider.setFilter({
      list: this.sessions as Nfs3Session[],
      query: this.filterString,
      columnKeys: ['export', 'ip'],
    });
  }

  private filterNfs4Data(): void {
    this.nfs4DataProvider.setFilter({
      list: this.sessions as Nfs4Session['info'][],
      query: this.filterString,
      columnKeys: ['name', 'clientid', 'address', 'status', 'seconds from last renew'],
    });
  }
}
