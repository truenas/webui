import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { Privilege } from 'app/interfaces/privilege.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { PrivilegeFormComponent } from 'app/pages/account/groups/privilege/privilege-form/privilege-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './privilege-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivilegeListComponent implements OnInit {
  dataProvider: AsyncDataProvider<Privilege>;
  columns = createTable<Privilege>([
    textColumn({
      identifier: true,
      title: this.translate.instant('Name'),
      propertyName: 'name',
      sortable: true,
    }),
    textColumn({
      title: this.translate.instant('Roles'),
      getValue: (row) => row.roles.join(', '),
    }),
    textColumn({
      title: this.translate.instant('Local Groups'),
      getValue: (row) => row.local_groups.length,
    }),
    textColumn({
      title: this.translate.instant('DS Groups'),
      getValue: (row) => row.ds_groups.length,
    }),
    yesNoColumn({
      title: this.translate.instant('Web Shell Access'),
      propertyName: 'web_shell',
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
          onClick: (row) => this.doDelete(row),
          hidden: (row) => of(!!row.builtin_name),
        },
      ],
    }),
  ]);

  privileges: Privilege[] = [];

  constructor(
    private slideInService: IxSlideInService,
    private ws: WebSocketService,
    private translate: TranslateService,
    private dialogService: DialogService,
    protected emptyService: EmptyService,
    private errorHandler: ErrorHandlerService,
  ) { }

  ngOnInit(): void {
    const privileges$ = this.ws.call('privilege.query').pipe(
      tap((privileges) => this.privileges = privileges),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<Privilege>(privileges$);
    this.getPrivileges();
  }

  getPrivileges(): void {
    this.dataProvider.load();
  }

  openForm(privilege?: Privilege): void {
    const slideInRef = this.slideInService.open(PrivilegeFormComponent, { data: privilege });
    slideInRef.slideInClosed$.pipe(filter(Boolean), untilDestroyed(this)).subscribe(() => {
      this.getPrivileges();
    });
  }

  doDelete(privilege: Privilege): void {
    this.dialogService
      .confirm({
        title: this.translate.instant('Delete Privilege'),
        message: this.translate.instant('Are you sure you want to delete the <b>{name}</b>?', {
          name: privilege.name,
        }),
        buttonText: this.translate.instant('Delete'),
      })
      .pipe(
        filter(Boolean),
        switchMap(() => this.ws.call('privilege.delete', [privilege.id])),
        untilDestroyed(this),
      )
      .subscribe({
        next: () => {
          this.getPrivileges();
        },
        error: (error) => {
          this.dialogService.error(this.errorHandler.parseWsError(error));
        },
      });
  }

  onListFiltered(query: string): void {
    const filterString = query.toLowerCase();
    this.dataProvider.setRows(this.privileges.filter((privileges) => {
      return privileges.name.toLowerCase().includes(filterString);
    }));
  }
}
