import {
  Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, forkJoin, map, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { Jbof } from 'app/interfaces/jbof.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { JbosFormComponent } from 'app/pages/system/view-enclosure/components/jbof-form/jbof-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './jbof-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class JbofListComponent implements OnInit {
  protected readonly requiredRoles = [Role.JbofWrite];

  filterString = '';
  jbofs: Jbof[] = [];
  canAddJbof = false;

  dataProvider: AsyncDataProvider<Jbof>;
  columns = createTable<Jbof>([
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'description',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('IPs'),
      getValue: (row) => [row.mgmt_ip1, row.mgmt_ip2].filter(Boolean).join(', '),
    }),
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'mgmt_username',
      sortable: true,
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.openForm(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          requiredRoles: this.requiredRoles,
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'jbof-' + row.mgmt_username,
  });

  get emptyConfigService(): EmptyService {
    return this.emptyService;
  }

  constructor(
    private ws: WebSocketService,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private emptyService: EmptyService,
    private loader: AppLoaderService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    const request$ = this.ws.call('jbof.query').pipe(
      tap((jbofs) => this.jbofs = jbofs),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider(request$);
    this.getJbofs();
  }

  openForm(jbof?: Jbof): void {
    const slideInRef = this.slideInService.open(JbosFormComponent, { data: jbof });
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => this.getJbofs());
  }

  doDelete(jbof: Jbof): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete'),
      message: this.translate.instant('Are you sure you want to delete this item?'),
      buttonText: this.translate.instant('Delete'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.ws.call('jbof.delete', [jbof.id]).pipe(this.loader.withLoader())),
      untilDestroyed(this),
    ).subscribe({
      next: () => this.getJbofs(),
      error: (error: unknown) => {
        this.dialogService.error(this.errorHandler.parseError(error));
      },
    });
  }

  getJbofs(): void {
    this.dataProvider.load();
    this.updateAvailableJbof();
  }

  updateAvailableJbof(): void {
    forkJoin([
      this.ws.call('jbof.query').pipe(map((jbofs) => jbofs.length)),
      this.ws.call('jbof.licensed'),
    ]).pipe(untilDestroyed(this)).subscribe(([jbofsLength, licensedLength]) => {
      this.canAddJbof = licensedLength > jbofsLength;
      this.cdr.markForCheck();
    });
  }

  onListFiltered(query: string): void {
    this.filterString = query.toLowerCase();
    this.dataProvider.setRows(this.jbofs.filter((jbof) => {
      return jbof.mgmt_username.toLowerCase().includes(this.filterString)
        || jbof.description.toLowerCase().includes(this.filterString);
    }));
  }
}
