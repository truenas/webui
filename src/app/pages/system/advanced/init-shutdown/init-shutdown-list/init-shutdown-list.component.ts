import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { switchMap } from 'rxjs';
import { filter } from 'rxjs/operators';
import { InitShutdownScriptType, initShutdownScriptTypeLabels } from 'app/enums/init-shutdown-script-type.enum';
import { initShutdownScriptWhenLabels } from 'app/enums/init-shutdown-script-when.enum';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import {
  actionsColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import {
  InitShutdownFormComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-init-shutdown-list',
  templateUrl: './init-shutdown-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitShutdownListComponent implements OnInit {
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
        },
      ],
    }),
  ]);

  constructor(
    private translate: TranslateService,
    private slideIn: IxSlideInService,
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
    this.slideIn.open(InitShutdownFormComponent)
      .slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.dataProvider.load());
  }

  editScript(script: InitShutdownScript): void {
    this.slideIn.open(InitShutdownFormComponent, { data: script })
      .slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
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
