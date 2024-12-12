import {
  ChangeDetectionStrategy, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  switchMap, filter, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { createTable } from 'app/modules/ix-table/utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { initShutdownCardElements } from 'app/pages/system/advanced/init-shutdown/init-shutdown-card/init-shutdown-card.elements';
import {
  InitShutdownFormComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-init-shutdown-card',
  templateUrl: './init-shutdown-card.component.html',
  styleUrls: ['./init-shutdown-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitShutdownCardComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = initShutdownCardElements;

  dataProvider: AsyncDataProvider<InitShutdownScript>;

  columns = createTable<InitShutdownScript>([
    textColumn({
      title: this.translate.instant('Command / Script'),
      propertyName: 'command',
      getValue: (row) => row.script || row.command,
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
    }),
    textColumn({
      title: this.translate.instant('When'),
      propertyName: 'when',
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    textColumn({
      title: this.translate.instant('Timeout'),
      propertyName: 'timeout',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'edit',
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.onEdit(row),
        },
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.onDelete(row),
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'card-init-shutdown-' + row.command + '-' + row.when,
    ariaLabels: (row) => [row.command, this.translate.instant('Init/Shutdown Script')],
  });

  constructor(
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialog: DialogService,
    private snackbar: SnackbarService,
    private firstTimeWarning: FirstTimeWarningService,
    protected emptyService: EmptyService,
    private chainedSlideIns: IxChainedSlideInService,
  ) {}

  ngOnInit(): void {
    this.loadScripts();
  }

  onAdd(): void {
    this.openForm();
  }

  loadScripts(): void {
    if (!this.dataProvider) {
      const scripts$ = this.ws.call('initshutdownscript.query').pipe(untilDestroyed(this));
      this.dataProvider = new AsyncDataProvider<InitShutdownScript>(scripts$);
    }
    this.dataProvider.load();
  }

  onDelete(row: InitShutdownScript): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete Script'),
      message: this.translate.instant('Delete Init/Shutdown Script {script}?', {
        script: row.command,
      }),
      buttonText: this.translate.instant('Delete'),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.ws.call('initshutdownscript.delete', [row.id])),
        filter(Boolean),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.snackbar.success(this.translate.instant('Script deleted.'));
        this.loadScripts();
      });
  }

  onEdit(row: InitShutdownScript): void {
    this.openForm(row);
  }

  private openForm(row?: InitShutdownScript): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.open(InitShutdownFormComponent, false, row)),
      filter((response) => !!response.response),
      tap(() => this.loadScripts()),
      untilDestroyed(this),
    ).subscribe();
  }
}
