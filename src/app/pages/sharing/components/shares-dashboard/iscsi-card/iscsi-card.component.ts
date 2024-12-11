import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, OnInit,
  signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, switchMap, tap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { IscsiTargetMode, iscsiTargetModeNames } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { iscsiCardElements } from 'app/pages/sharing/components/shares-dashboard/iscsi-card/iscsi-card.elements';
import { ServiceExtraActionsComponent } from 'app/pages/sharing/components/shares-dashboard/service-extra-actions/service-extra-actions.component';
import { ServiceStateButtonComponent } from 'app/pages/sharing/components/shares-dashboard/service-state-button/service-state-button.component';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-card',
  templateUrl: './iscsi-card.component.html',
  styleUrls: ['./iscsi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    MatToolbarRow,
    TestDirective,
    IxIconComponent,
    ServiceStateButtonComponent,
    RequiresRolesDirective,
    MatButton,
    UiSearchDirective,
    ServiceExtraActionsComponent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerShowMoreComponent,
    TranslateModule,
    AsyncPipe,
    RouterLink,
  ],
})
export class IscsiCardComponent implements OnInit {
  service$ = this.store$.select(selectService(ServiceName.Iscsi));
  requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  targets = signal<IscsiTarget[]>(null);

  protected readonly searchableElements = iscsiCardElements;

  dataProvider: AsyncDataProvider<IscsiTarget>;

  columns = createTable<IscsiTarget>([
    textColumn({
      title: this.translate.instant('Target Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Target Alias'),
      propertyName: 'alias',
    }),
    textColumn({
      title: this.translate.instant('Mode'),
      propertyName: 'mode',
      hidden: true,
      getValue: (row) => (iscsiTargetModeNames.has(row.mode)
        ? this.translate.instant(iscsiTargetModeNames.get(row.mode))
        : row.mode || '-'),
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'card-iscsi-target-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('iSCSI Target')],
  });

  constructor(
    private slideInService: SlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private api: ApiService,
    private dialogService: DialogService,
    protected emptyService: EmptyService,
    private store$: Store<ServicesState>,
    private cdr: ChangeDetectorRef,
  ) {
    effect(() => {
      if (this.targets()?.some((target) => target.mode !== IscsiTargetMode.Iscsi)) {
        this.columns = this.columns.map((column) => {
          if (column.propertyName === 'mode') {
            return {
              ...column,
              hidden: false,
            };
          }

          return column;
        });
        this.cdr.detectChanges();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    const iscsiShares$ = this.api.call('iscsi.target.query').pipe(
      tap((targets) => {
        this.targets.set(targets);
      }),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<IscsiTarget>(iscsiShares$);
    this.setDefaultSort();
    this.dataProvider.load();
  }

  openForm(row?: IscsiTarget, openWizard?: boolean): void {
    let slideInRef;

    if (openWizard) {
      slideInRef = this.slideInService.open(IscsiWizardComponent, { data: row, wide: true });
    } else {
      slideInRef = this.slideInService.open(TargetFormComponent, { data: row, wide: true });
    }

    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.dataProvider.load();
    });
  }

  doDelete(iscsi: IscsiTarget): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Are you sure you want to delete iSCSI Share <b>"{name}"</b>?', { name: iscsi.name }),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('iscsi.target.delete', [iscsi.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
      },
      error: (err: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  setDefaultSort(): void {
    this.dataProvider.setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }
}
