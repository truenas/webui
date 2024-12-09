import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter, from, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { Tunable } from 'app/interfaces/tunable.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import {
  yesNoColumn,
} from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { sysctlCardElements } from 'app/pages/system/advanced/sysctl/sysctl-card/sysctl-card.elements';
import { TunableFormComponent } from 'app/pages/system/advanced/sysctl/tunable-form/tunable-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-sysctl-card',
  templateUrl: './sysctl-card.component.html',
  styleUrls: ['./sysctl-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    TestDirective,
    RouterLink,
    IxIconComponent,
    RequiresRolesDirective,
    MatButton,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    TranslateModule,
    AsyncPipe,
  ],
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
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.onEdit(row),
        },
        {
          iconName: iconMarker('mdi-delete'),
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
    private api: ApiService,
    private dialog: DialogService,
    private snackbar: SnackbarService,
    private firstTimeWarning: FirstTimeWarningService,
    protected emptyService: EmptyService,
    private chainedSlideIns: ChainedSlideInService,
  ) {}

  ngOnInit(): void {
    const tunables$ = this.api.call('tunable.query').pipe(untilDestroyed(this));
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
        switchMap(() => this.api.job('tunable.delete', [row.id])),
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
    from(this.firstTimeWarning.showFirstTimeWarningIfNeeded()).pipe(
      switchMap(() => this.chainedSlideIns.open(TunableFormComponent, false, row)),
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => {
      this.loadItems();
    });
  }
}
