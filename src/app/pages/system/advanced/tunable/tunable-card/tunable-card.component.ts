import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  tnIconMarker,
  TnButtonComponent,
  TnCardComponent,
  TnCardFooterActionsDirective,
  TnCardHeaderDirective,
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnSidePanelActionDirective,
  TnSidePanelComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTestIdDirective,
  TnTooltipDirective,
} from '@truenas/ui-components';
import { Observable, of, take } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { Tunable } from 'app/interfaces/tunable.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { tunableCardElements } from 'app/pages/system/advanced/tunable/tunable-card/tunable-card.elements';
import { TunableFormComponent } from 'app/pages/system/advanced/tunable/tunable-form/tunable-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

@Component({
  selector: 'ix-tunable-card',
  templateUrl: './tunable-card.component.html',
  styleUrls: ['./tunable-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardFooterActionsDirective,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    UiSearchDirective,
    TnTestIdDirective,
    TnTooltipDirective,
    RouterLink,
    TnIconComponent,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TableActionsCellComponent,
    TunableFormComponent,
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
  private unsavedChanges = inject(UnsavedChangesService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.SystemTunableWrite];
  protected readonly searchableElements = tunableCardElements;

  protected configOpen = signal(false);
  protected editingTunable = signal<Tunable | undefined>(undefined);
  protected configForm = viewChild(TunableFormComponent);

  protected readonly panelTitle = computed(() => (
    this.editingTunable()
      ? this.translate.instant('Edit Tunable')
      : this.translate.instant('Add Tunable')
  ));

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

  protected readonly closeGuard = (): Observable<boolean> => {
    return this.configForm()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

  ngOnInit(): void {
    const tunables$ = this.api.call('tunable.query').pipe(takeUntilDestroyed(this.destroyRef));
    this.dataProvider = new AsyncDataProvider<Tunable>(tunables$);
    this.loadItems();
  }

  onAdd(): void {
    this.openForm(undefined);
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

  private openForm(row: Tunable | undefined): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.editingTunable.set(row);
      this.configOpen.set(true);
    });
  }

  protected onConfigClosed(saved: boolean): void {
    this.configOpen.set(false);
    this.editingTunable.set(undefined);
    if (saved) {
      this.loadItems();
    }
  }
}
