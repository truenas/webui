import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, from, switchMap } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { Tunable } from 'app/interfaces/tunable.interface';
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
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { sysctlCardElements } from 'app/pages/system/advanced/sysctl/sysctl-card/sysctl-card.elements';
import { TunableFormComponent } from 'app/pages/system/advanced/sysctl/tunable-form/tunable-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-sysctl-card',
  templateUrl: './sysctl-card.component.html',
  styleUrls: ['./sysctl-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SysctlCardComponent implements OnInit {
  readonly requiredRoles = [Role.FullAdmin];
  protected readonly searchableElements = sysctlCardElements;

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
          requiredRoles: this.requiredRoles,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'sysctl-' + row.var + '-' + row.value,
    ariaLabels: (row) => [row.var, this.translate.instant('Sysctl')],
  });

  constructor(
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private ws: WebSocketService,
    private dialog: DialogService,
    private snackbar: SnackbarService,
    private advancedSettings: AdvancedSettingsService,
    protected emptyService: EmptyService,
    private chainedSlideIns: IxChainedSlideInService,
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
      switchMap(() => this.chainedSlideIns.open(TunableFormComponent, false, row)),
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => {
      this.loadItems();
    });
  }
}
