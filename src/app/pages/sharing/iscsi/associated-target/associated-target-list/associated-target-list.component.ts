import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { find } from 'lodash';
import { combineLatest } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { IscsiExtent, IscsiTarget, IscsiTargetExtent } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { AssociatedTargetFormComponent } from 'app/pages/sharing/iscsi/associated-target/associated-target-form/associated-target-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IscsiService } from 'app/services/iscsi.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-associated-target-list',
  templateUrl: './associated-target-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AssociatedTargetListComponent implements OnInit {
  readonly requiredRoles = [
    Role.SharingIscsiTargetExtentWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  isLoading = false;
  filterString = '';
  dataProvider: AsyncDataProvider<IscsiTargetExtent>;

  targets: IscsiTarget[] = [];
  extents: IscsiExtent[] = [];
  targetExtents: IscsiTargetExtent[] = [];

  columns = createTable<IscsiTargetExtent>([
    textColumn({
      title: this.translate.instant('Target'),
      propertyName: 'target',
      getValue: (row) => {
        return find(this.targets, { id: row.target })?.name || row.target;
      },
    }),
    textColumn({
      title: this.translate.instant('LUN ID'),
      propertyName: 'lunid',
    }),
    textColumn({
      title: this.translate.instant('Extent'),
      propertyName: 'extent',
      getValue: (row) => {
        return find(this.extents, { id: row.extent })?.name || row.extent;
      },
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (targetExtent) => {
            const slideInRef = this.slideInService.open(AssociatedTargetFormComponent, { data: targetExtent });
            slideInRef.slideInClosed$
              .pipe(filter(Boolean), untilDestroyed(this))
              .subscribe(() => this.dataProvider.load());
          },
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => {
            this.iscsiService.getGlobalSessions()
              .pipe(this.loader.withLoader(), untilDestroyed(this))
              .subscribe(
                (sessions) => {
                  let warningMsg = '';
                  sessions.forEach((session) => {
                    if (Number(session.target.split(':')[1]) === row.target) {
                      warningMsg = `<font color="red">${this.translate.instant('Warning: iSCSI Target is already in use.</font><br>')}`;
                    }
                  });
                  const targetName = this.targets.find((target) => target.id === row.target)?.name;
                  const extentName = this.extents.find((extent) => extent.id === row.extent)?.name;
                  const deleteMsg = this.translate.instant('Delete Target/Extent {name}', { name: `${targetName} - ${extentName}` });

                  this.dialogService.confirm({
                    title: this.translate.instant('Delete'),
                    message: warningMsg + deleteMsg,
                    buttonText: this.translate.instant('Delete'),
                  }).pipe(
                    filter(Boolean),
                    switchMap(() => this.ws.call('iscsi.targetextent.delete', [row.id, true]).pipe(this.loader.withLoader())),
                    untilDestroyed(this),
                  ).subscribe({
                    next: () => this.dataProvider.load(),
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
    rowTestId: (row) => 'iscsi-associated-target-' + row.target + '-' + row.extent,
    ariaLabels: (row) => [row.target.toString(), this.translate.instant('ISCSI Associated Target')],
  });

  constructor(
    public emptyService: EmptyService,
    private errorHandler: ErrorHandlerService,
    private iscsiService: IscsiService,
    private loader: AppLoaderService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.isLoading = true;
    const targetExtent$ = this.iscsiService.getTargetExtents().pipe(
      tap((targetExtents) => this.targetExtents = targetExtents),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider(targetExtent$);
    this.loadData();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  loadData(): void {
    combineLatest([
      this.iscsiService.getTargets(),
      this.iscsiService.getExtents(),
    ]).pipe(
      untilDestroyed(this),
    ).subscribe(([targets, extents]) => {
      this.targets = targets;
      this.extents = extents;
      this.dataProvider.load();
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  doAdd(): void {
    const slideInRef = this.slideInService.open(AssociatedTargetFormComponent);
    slideInRef.slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  onListFiltered(query: string): void {
    this.filterString = query;
    const extentNames = this.extents.map((extent) => ({ name: extent.name.toLowerCase(), id: extent.id }));
    const targetNames = this.targets.map((target) => ({ name: target.name.toLowerCase(), id: target.id }));
    this.dataProvider.setFilter({
      query,
      columnKeys: ['extent'],
      preprocessMap: {
        extent: (id: number) => [...targetNames, ...extentNames].find((item) => item.id === id).name,
      },
    });
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
