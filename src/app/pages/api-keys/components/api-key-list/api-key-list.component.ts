import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, TemplateRef, ViewChild, AfterViewInit,
} from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { untilDestroyed, UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import { filter, switchMap } from 'rxjs/operators';
import { ApiKey } from 'app/interfaces/api-key.interface';
import { EmptyConfig, EmptyType } from 'app/modules/entity/entity-empty/entity-empty.component';
import { ApiKeyFormDialogComponent } from 'app/pages/api-keys/components/api-key-form-dialog/api-key-form-dialog.component';
import { ApiKeyComponentStore } from 'app/pages/api-keys/store/api-key.store';
import { DialogService } from 'app/services';
import { LayoutService } from 'app/services/layout.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './api-key-list.component.html',
  styleUrls: ['./api-key-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApiKeyListComponent implements OnInit, AfterViewInit {
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild('pageHeader') pageHeader: TemplateRef<unknown>;

  displayedColumns: string[] = ['name', 'created_at', 'actions'];
  dataSource: MatTableDataSource<ApiKey> = new MatTableDataSource([]);
  defaultSort: Sort = { active: 'name', direction: 'asc' };
  filterValue = '';
  loadingConfig: EmptyConfig = {
    type: EmptyType.Loading,
    large: false,
    title: this.translate.instant('Loading...'),
  };
  isLoading$ = this.store.isLoading$;
  emptyOrErrorConfig$: Observable<EmptyConfig> = this.store.isError$.pipe(
    switchMap((hasError) => {
      if (hasError) {
        return of({
          type: EmptyType.Errors,
          large: true,
          title: this.translate.instant('Can not retrieve response'),
        });
      }

      return of({
        type: EmptyType.NoPageData,
        title: this.translate.instant('No API Keys'),
        large: true,
      });
    }),
  );

  constructor(
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private store: ApiKeyComponentStore,
    private layoutService: LayoutService,
    private matDialog: MatDialog,
    private dialog: DialogService,
    private ws: WebSocketService,
  ) { }

  ngOnInit(): void {
    this.getApiKeys();
  }

  ngAfterViewInit(): void {
    this.layoutService.pageHeaderUpdater$.next(this.pageHeader);
  }

  getApiKeys(): void {
    this.store.loadApiKeys();
    this.store.apiKeys$.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (apiKeys) => {
        this.createDataSource(apiKeys);
        this.cdr.markForCheck();
      },
      error: () => {
        this.createDataSource();
        this.cdr.markForCheck();
      },
    });
  }

  openApiKeyForm(row?: ApiKey): void {
    this.matDialog
      .open(ApiKeyFormDialogComponent, { data: row })
      .afterClosed()
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  doDelete(apiKey: ApiKey): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete API Key'),
      message: this.translate.instant('Are you sure you want to delete the <b>{name}</b> API Key?', { name: apiKey.name }),
      buttonMsg: this.translate.instant('Delete'),
      cancelMsg: this.translate.instant('Cancel'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('api_key.delete', [String(apiKey.id)])),
      untilDestroyed(this),
    ).subscribe(() => {
      this.store.apiKeyDeleted(apiKey.id);
    });
  }

  private createDataSource(apiKeys: ApiKey[] = []): void {
    this.dataSource = new MatTableDataSource(apiKeys);
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'name':
          return item.name;
        case 'created_at':
          return item.created_at.$date;
      }
    };
    this.store.patchState({ isLoading: false });
    this.cdr.markForCheck();
  }

  onSearch(filterString: string): void {
    this.dataSource.filter = filterString;
  }
}
