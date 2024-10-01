import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter, switchMap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { ServiceName } from 'app/enums/service-name.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { iscsiCardElements } from 'app/pages/sharing/components/shares-dashboard/iscsi-card/iscsi-card.elements';
import { IscsiWizardComponent } from 'app/pages/sharing/iscsi/iscsi-wizard/iscsi-wizard.component';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-card',
  templateUrl: './iscsi-card.component.html',
  styleUrls: ['./iscsi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IscsiCardComponent implements OnInit {
  service$ = this.store$.select(selectService(ServiceName.Iscsi));
  requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

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
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialogService: DialogService,
    protected emptyService: EmptyService,
    private store$: Store<ServicesState>,
  ) {}

  ngOnInit(): void {
    const iscsiShares$ = this.ws.call('iscsi.target.query').pipe(untilDestroyed(this));
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
      switchMap(() => this.ws.call('iscsi.target.delete', [iscsi.id])),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.dataProvider.load();
      },
      error: (err) => {
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
