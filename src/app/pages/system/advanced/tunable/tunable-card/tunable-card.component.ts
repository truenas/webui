import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
} from '@truenas/ui-components';
import { from, switchMap } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { Tunable } from 'app/interfaces/tunable.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { tunableCardElements } from 'app/pages/system/advanced/tunable/tunable-card/tunable-card.elements';
import { getTunableFormConfig } from 'app/pages/system/advanced/tunable/tunable-form/tunable.form-config';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

@Component({
  selector: 'ix-tunable-card',
  templateUrl: './tunable-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TableActionsCellComponent,
    TranslateModule,
    AsyncPipe,
    YesNoPipe,
  ],
})
export class TunableCardComponent implements OnInit {
  protected emptyService = inject(EmptyService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private dialog = inject(DialogService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private formPanel = inject(FormSidePanelService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemTunableWrite];
  protected readonly searchableElements = tunableCardElements;

  dataProvider: AsyncDataProvider<Tunable>;

  protected readonly displayedColumns = ['var', 'value', 'enabled', 'comment', 'actions'];

  protected readonly trackByVar = (_: number, row: Tunable): string => `${row.var}-${row.value}`;

  protected readonly actions: IconActionConfig<Tunable>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.onEdit(row),
    },
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.onDelete(row),
      requiredRoles: this.requiredRoles,
    },
  ];

  protected uniqueRowTag(row: Tunable): string {
    return `tunable-${row.var}-${row.value}`;
  }

  protected ariaLabel(row: Tunable): string {
    return [row.var, this.translate.instant('Tunable')].join(' ');
  }

  ngOnInit(): void {
    const tunables$ = this.api.call('tunable.query').pipe(takeUntilDestroyed(this.destroyRef));
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
    const type = row.type?.toUpperCase() || '';
    this.dialog.confirmDelete({
      title: this.translate.instant('Delete Tunable ({type})', { type }),
      message: this.translate.instant('Are you sure you want to delete "{name}"?', {
        name: row.var,
      }),
      job: () => this.api.job('tunable.delete', [row.id]),
      jobProgressTitle: this.translate.instant('Deleting...'),
      successMessage: this.translate.instant('Variable deleted.'),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.loadItems());
  }

  onEdit(row: Tunable): void {
    this.openForm(row);
  }

  private openForm(row?: Tunable): void {
    const title = row
      ? this.translate.instant('Edit Tunable ({type})', { type: row.type?.toUpperCase() || '' })
      : this.translate.instant('Add Tunable');
    from(this.firstTimeWarning.showFirstTimeWarningIfNeeded()).pipe(
      switchMap(() => this.formPanel.openForm(
        getTunableFormConfig(this.api, this.translate, row),
        { title, editData: row },
      ).success$),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.loadItems();
    });
  }
}
