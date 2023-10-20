import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, from, switchMap } from 'rxjs';
import { Tunable } from 'app/interfaces/tunable.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { TunableFormComponent } from 'app/pages/system/advanced/sysctl/tunable-form/tunable-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-sysctl-card',
  templateUrl: './sysctl-card.component.html',
  styleUrls: ['./sysctl-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SysctlCardComponent implements OnInit {
  dataProvider: AsyncDataProvider<Tunable>;

  columns = createTable<Tunable>([
    textColumn({
      title: this.translate.instant('Var'),
      propertyName: 'var',
    }),
    textColumn({
      title: this.translate.instant('Value'),
      propertyName: 'value',
    }),
    yesNoColumn({
      title: this.translate.instant('Enabled'),
      propertyName: 'enabled',
    }),
    textColumn({
      title: this.translate.instant('Description'),
      propertyName: 'comment',
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
        },
      ],
    }),
  ]);

  constructor(
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialog: DialogService,
    private snackbar: SnackbarService,
    private advancedSettings: AdvancedSettingsService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const tunables$ = this.ws.call('tunable.query').pipe(untilDestroyed(this));
    this.dataProvider = new AsyncDataProvider<Tunable>(tunables$);
    this.loadItems();
  }

  onAdd(): void {
    this.openForm();
  }

  loadItems(): void {
    this.dataProvider.load();
  }

  onDelete(row: Tunable): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete'),
      message: this.translate.instant('Delete Sysctl Variable {variable}?', {
        variable: row.var,
      }),
      buttonText: this.translate.instant('Delete'),
    })
      .pipe(
        filter(Boolean),
        switchMap(() => this.ws.job('tunable.delete', [row.id])),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe({
        complete: () => {
          this.snackbar.success(this.translate.instant('Variable deleted.'));
          this.loadItems();
        },
      });
  }

  onEdit(row: Tunable): void {
    this.openForm(row);
  }

  private openForm(row?: Tunable): void {
    from(this.advancedSettings.showFirstTimeWarningIfNeeded()).pipe(
      switchMap(() => this.slideInService.open(TunableFormComponent, { data: row }).slideInClosed$),
      filter(Boolean),
      untilDestroyed(this),
    )
      .subscribe(() => {
        this.loadItems();
      });
  }
}
