import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, effect, input, OnInit, output, inject, signal, Type } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnIconComponent, TnTablePagerComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { IscsiTargetMode, iscsiTargetModeNames } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { templateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-template/ix-cell-template.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { targetListElements } from 'app/pages/sharing/iscsi/target/all-targets/target-list/target-list.elements';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';

@Component({
  selector: 'ix-iscsi-target-list',
  templateUrl: './target-list.component.html',
  styleUrls: ['./target-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    FakeProgressBarComponent,
    MatToolbarRow,
    BasicSearchComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    TnTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    TnIconComponent,
    UiSearchDirective,
    IxTableCellDirective,
  ],
})
export class TargetListComponent implements OnInit {
  emptyService = inject(EmptyService);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  readonly toggleShowMobileDetails = output<boolean>();
  readonly dataProvider = input.required<AsyncDataProvider<IscsiTarget>>();
  readonly targets = input<IscsiTarget[]>();

  protected readonly searchableElements = targetListElements;

  protected readonly requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  searchQuery = signal('');

  columns = createTable<IscsiTarget>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Alias'),
      propertyName: 'alias',
    }),
    textColumn({
      title: this.translate.instant('Mode'),
      propertyName: 'mode',
      hidden: true,
      getValue: (row) => {
        return this.translate.instant(iscsiTargetModeNames.get(row.mode) || row.mode) || '-';
      },
    }),
    templateColumn({
      cssClass: 'view-details-column',
    }),
  ], {
    uniqueRowTag: (row) => 'iscsi-target-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Target')],
  });

  constructor() {
    effect(() => {
      if (this.targets()?.some((target) => target.mode !== IscsiTargetMode.Iscsi)) {
        this.columns = this.columns.map((column) => {
          if (column.propertyName === 'mode') {
            return {
              ...column,
              hidden: false,
            };
          }

          return column;
        });
        this.cdr.detectChanges();
        this.cdr.markForCheck();
      }
    });
  }

  ngOnInit(): void {
    this.setDefaultSort();
    this.dataProvider().load();
    this.dataProvider().emptyType$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      this.onListFiltered(this.searchQuery());
    });
  }

  expanded(target: IscsiTarget): void {
    this.toggleShowMobileDetails.emit(!!target);
    if (!target) {
      this.dataProvider().expandedRow = null;
      this.cdr.markForCheck();
    }
  }

  setDefaultSort(): void {
    this.dataProvider().setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  // TargetFormComponent structurally provides the side-panel host surface (closed/canSubmit/
  // submit/hasUnsavedChanges/requiredRoles); cast past the nominal base type.
  private readonly targetForm = TargetFormComponent as unknown as Type<SidePanelForm>;

  doAdd(): void {
    // The created target's expand + reload is driven by `iscsiService.refreshData(...)` (emitted
    // from the form's onSuccess) which `all-targets` listens for and reloads the shared
    // dataProvider — so no explicit reload here (it would double-load).
    this.formPanel.open(this.targetForm, {
      title: this.translate.instant('Add ISCSI Target'),
      wide: true,
    });
  }

  onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.dataProvider().setFilter({ query, columnKeys: ['name'] });
  }
}
