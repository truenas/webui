import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-target-list',
  templateUrl: './target-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    FakeProgressBarComponent,
    MatToolbarRow,
    SearchInput1Component,
    IxTableColumnsSelectorComponent,
    RequiresRolesDirective,
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
export class TargetListComponent implements OnInit {
  readonly requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  dataProvider: AsyncDataProvider<IscsiTarget>;
  filterString = '';
  targets: IscsiTarget[] = [];

  columns = createTable<IscsiTarget>([
    textColumn({
      title: this.translate.instant('Target Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Target Alias'),
      propertyName: 'alias',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (target) => {
            const slideInRef = this.slideInService.open(TargetFormComponent, { data: target, wide: true });
            slideInRef.slideInClosed$
              .pipe(filter(Boolean), untilDestroyed(this))
              .subscribe(() => this.refresh());
          },
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => {
            this.iscsiService.getGlobalSessions().pipe(untilDestroyed(this)).subscribe(
              (sessions) => {
                let warningMsg = '';
                sessions.forEach((session) => {
                  if (Number(session.target.split(':')[1]) === row.id) {
                    warningMsg = `<font color="red">${this.translate.instant('Warning: iSCSI Target is already in use.</font><br>')}`;
                  }
                });
                const deleteMsg = this.translate.instant('Delete Target {name}', { name: row.name });

                this.dialogService.confirm({
                  title: this.translate.instant('Delete'),
                  message: warningMsg + deleteMsg,
                  buttonText: this.translate.instant('Delete'),
                }).pipe(
                  filter(Boolean),
                  switchMap(() => this.ws.call('iscsi.target.delete', [row.id, true]).pipe(this.loader.withLoader())),
                  untilDestroyed(this),
                ).subscribe({
                  next: () => this.refresh(),
                  error: (error: unknown) => {
                    this.dialogService.error(this.errorHandler.parseError(error));
                  },
                });
              },
            );
          },
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'iscsi-target-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Target')],
  });

  constructor(
    public emptyService: EmptyService,
    private iscsiService: IscsiService,
    private slideInService: SlideInService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private loader: AppLoaderService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const targets$ = this.iscsiService.getTargets().pipe(
      tap((targets) => this.targets = targets),
    );
    this.dataProvider = new AsyncDataProvider(targets$);
    this.setDefaultSort();
    this.refresh();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(TargetFormComponent, { wide: true });
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.refresh());
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setFilter({ query, columnKeys: ['name'] });
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private refresh(): void {
    this.dataProvider.load();
  }
}
