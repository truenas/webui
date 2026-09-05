import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, OnInit, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatToolbarRow } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { tnIconMarker } from '@truenas/ui-components';
import { filter, switchMap, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { s3AccessKeyStatusLabels } from 'app/enums/s3.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { S3AccessKey } from 'app/interfaces/s3.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsWithMenuColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions-with-menu/ix-cell-actions-with-menu.component';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { relativeDateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-relative-date/ix-cell-relative-date.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  S3AccessKeyCredentialsDialogComponent,
} from 'app/pages/credentials/s3-access-keys/s3-access-key-credentials-dialog/s3-access-key-credentials-dialog.component';
import { S3AccessKeyFormComponent } from 'app/pages/credentials/s3-access-keys/s3-access-key-form/s3-access-key-form.component';
import { s3AccessKeyListElements } from 'app/pages/credentials/s3-access-keys/s3-access-key-list/s3-access-key-list.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-s3-access-key-list',
  templateUrl: './s3-access-key-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    FakeProgressBarComponent,
    MatToolbarRow,
    BasicSearchComponent,
    MatAnchor,
    TestDirective,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
    MatButton,
    UiSearchDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    RouterLink,
    EmptyComponent,
  ],
})
export class S3AccessKeyListComponent implements OnInit {
  private loader = inject(LoaderService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private dialog = inject(DialogService);
  private matDialog = inject(MatDialog);
  private snackbar = inject(SnackbarService);
  private errorHandler = inject(ErrorHandlerService);
  private slideIn = inject(SlideIn);
  private cdr = inject(ChangeDetectorRef);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  requiredRoles = [Role.SharingS3Write, Role.SharingWrite];
  protected readonly searchableElements = s3AccessKeyListElements;
  protected readonly EmptyType = EmptyType;

  protected readonly emptyConfig: EmptyConfig = {
    type: EmptyType.NoPageData,
    icon: tnIconMarker('key-variant', 'mdi'),
    large: true,
    title: this.translate.instant('No S3 Access Keys'),
    message: this.translate.instant(
      'An access key is the credential pair a client signs S3 requests with. It belongs to a user, and the S3 service runs that key\'s requests as that user.',
    ),
  };

  searchQuery = signal('');
  dataProvider: AsyncDataProvider<S3AccessKey>;

  columns = createTable<S3AccessKey>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('User'),
      propertyName: 'username',
      getValue: (row) => row.username ?? this.translate.instant('Missing'),
    }),
    textColumn({
      title: this.translate.instant('Access Key ID'),
      propertyName: 'access_key',
    }),
    textColumn({
      title: this.translate.instant('Status'),
      propertyName: 'status',
      getValue: (row) => this.translate.instant(s3AccessKeyStatusLabels.get(row.status) || row.status),
    }),
    relativeDateColumn({
      title: this.translate.instant('Expires On'),
      propertyName: 'expires_at',
      getValue: (row) => row.expires_at?.$date || this.translate.instant('Never'),
    }),
    dateColumn({
      title: this.translate.instant('Created'),
      propertyName: 'created_at',
      hidden: true,
    }),
    actionsWithMenuColumn({
      actions: [
        {
          iconName: tnIconMarker('pencil', 'mdi'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        },
        {
          iconName: tnIconMarker('refresh', 'mdi'),
          tooltip: this.translate.instant('Rotate Secret'),
          onClick: (row) => this.doRotate(row),
          requiredRoles: this.requiredRoles,
        },
        {
          iconName: tnIconMarker('delete', 'mdi'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 's3-access-key-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('S3 Access Key')],
  });

  private accessKeys: S3AccessKey[] = [];

  ngOnInit(): void {
    const keys$ = this.api.call('s3.accesskey.query').pipe(
      tap((keys) => this.accessKeys = keys),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<S3AccessKey>(keys$);
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
    this.dataProvider.emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
    this.refresh();
  }

  protected doAdd(): void {
    this.slideIn.open(S3AccessKeyFormComponent).pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.refresh());
  }

  protected doEdit(key: S3AccessKey): void {
    this.slideIn.open(S3AccessKeyFormComponent, { data: key }).pipe(
      filter((response) => !!response.response),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.refresh());
  }

  protected doRotate(key: S3AccessKey): void {
    this.dialog.confirm({
      title: this.translate.instant('Rotate secret for "{name}"?', { name: key.name }),
      message: this.translate.instant(
        'A new secret access key is generated under the same access key ID and shown once. Clients using the current secret will stop working.',
      ),
      buttonText: this.translate.instant('Rotate'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('s3.accesskey.update', [key.id, { rotate: true }]).pipe(this.loader.withLoader())),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (rotated) => {
        this.snackbar.success(this.translate.instant('Secret access key rotated'));
        this.refresh();
        this.matDialog.open(S3AccessKeyCredentialsDialogComponent, { data: rotated });
      },
      error: (error: unknown) => this.errorHandler.showErrorModal(error),
    });
  }

  protected doDelete(key: S3AccessKey): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete S3 access key "{name}"?', { name: key.name }),
      message: this.translate.instant('Clients signing requests with this key will be refused.'),
      buttonText: this.translate.instant('Delete'),
      buttonColor: 'warn',
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('s3.accesskey.delete', [key.id]).pipe(this.loader.withLoader())),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => this.refresh(),
      error: (error: unknown) => this.errorHandler.showErrorModal(error),
    });
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider.setFilter({
      query,
      columnKeys: !this.accessKeys.length ? [] : ['name', 'username', 'access_key'],
    });
    this.cdr.markForCheck();
  }

  protected columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private refresh(): void {
    this.dataProvider.load();
  }
}
