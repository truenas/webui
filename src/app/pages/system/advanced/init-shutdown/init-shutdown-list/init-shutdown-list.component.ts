import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs';
import { filter } from 'rxjs/operators';
import { InitShutdownScriptType, initShutdownScriptTypeLabels } from 'app/enums/init-shutdown-script-type.enum';
import { initShutdownScriptWhenLabels } from 'app/enums/init-shutdown-script-when.enum';
import { Role } from 'app/enums/role.enum';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import {
  actionsColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { createTable } from 'app/modules/ix-table/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  InitShutdownFormComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { initShudownListElements } from 'app/pages/system/advanced/init-shutdown/init-shutdown-list/init-shutdown-list.elements';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-init-shutdown-list',
  templateUrl: './init-shutdown-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitShutdownListComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = initShudownListElements;

  dataProvider: AsyncDataProvider<InitShutdownScript>;

  columns = createTable<InitShutdownScript>([
    textColumn({
      title: this.translate.instant('Type'),
      propertyName: 'type',
      sortable: true,
      getValue: (row) => {
        const typeLabel = initShutdownScriptTypeLabels.get(row.type);
        return this.translate.instant(typeLabel);
      },
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
      sortable: false,
    }),
    textColumn({
      title: this.translate.instant('When'),
      propertyName: 'when',
      sortable: true,
      getValue: (row) => {
        const whenLabel = initShutdownScriptWhenLabels.get(row.when);
        return this.translate.instant(whenLabel);
      },
    }),
    textColumn({
      title: this.translate.instant('Command/Script'),
      propertyName: 'script',
      sortable: false,
      getValue: (row) => (row.type === InitShutdownScriptType.Command ? row.command : row.script),
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
      sortable: true,
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.editScript(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.deleteScript(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'init-shutdown-' + row.command + '-' + row.type,
  });

  constructor(
    private translate: TranslateService,
    private chainedSlideIns: IxChainedSlideInService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private errorHandler: ErrorHandlerService,
    private loader: AppLoaderService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    this.dataProvider = new AsyncDataProvider(this.ws.call('initshutdownscript.query'));
    this.dataProvider.load();
  }

  addScript(): void {
    this.chainedSlideIns.open(InitShutdownFormComponent)
      .pipe(filter((response) => !!response.response), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  editScript(script: InitShutdownScript): void {
    this.chainedSlideIns.open(InitShutdownFormComponent, false, script)
      .pipe(filter((response) => !!response.response), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  deleteScript(script: InitShutdownScript): void {
    this.dialogService.confirm({
      title: this.translate.instant('Confirmation'),
      message: this.translate.instant('Are you sure you want to delete this script?'),
      hideCheckbox: true,
    }).pipe(
      filter(Boolean),
      switchMap(() => {
        return this.ws.call('initshutdownscript.delete', [script.id]).pipe(
          this.errorHandler.catchError(),
          this.loader.withLoader(),
        );
      }),
      untilDestroyed(this),
    ).subscribe(() => this.dataProvider.load());
  }
}
