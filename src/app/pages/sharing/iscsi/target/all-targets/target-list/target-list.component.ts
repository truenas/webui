import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, input, OnInit,
  output,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { IscsiTargetMode, iscsiTargetModeNames } from 'app/enums/iscsi.enum';
import { Role } from 'app/enums/role.enum';
import { IscsiTarget } from 'app/interfaces/iscsi.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { templateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-template/ix-cell-template.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { createTable } from 'app/modules/ix-table/utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { targetListElements } from 'app/pages/sharing/iscsi/target/all-targets/target-list/target-list.elements';
import { TargetFormComponent } from 'app/pages/sharing/iscsi/target/target-form/target-form.component';

@UntilDestroy()
@Component({
  selector: 'ix-iscsi-target-list',
  templateUrl: './target-list.component.html',
  styleUrls: ['./target-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatCard,
    FakeProgressBarComponent,
    MatToolbarRow,
    SearchInput1Component,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTablePagerComponent,
    TranslateModule,
    AsyncPipe,
    IxIconComponent,
    UiSearchDirective,
    IxTableCellDirective,
  ],
})
export class TargetListComponent implements OnInit {
  readonly isMobileView = input<boolean>();
  readonly toggleShowMobileDetails = output<boolean>();
  readonly dataProvider = input.required<AsyncDataProvider<IscsiTarget>>();
  readonly targets = input<IscsiTarget[]>();

  protected readonly searchableElements = targetListElements;

  protected readonly requiredRoles = [
    Role.SharingIscsiTargetWrite,
    Role.SharingIscsiWrite,
    Role.SharingWrite,
  ];

  filterString = '';

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

  constructor(
    public emptyService: EmptyService,
    private slideIn: SlideIn,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
  ) {
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
    this.dataProvider().emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  expanded(target: IscsiTarget): void {
    if (this.isMobileView()) {
      this.toggleShowMobileDetails.emit(!!target);
      if (!target) {
        this.dataProvider().expandedRow = null;
        this.cdr.markForCheck();
      }
    }
  }

  setDefaultSort(): void {
    this.dataProvider().setSorting({
      active: 0,
      direction: SortDirection.Asc,
      propertyName: 'name',
    });
  }

  doAdd(): void {
    this.slideIn.open(TargetFormComponent, { wide: true })
      .pipe(
        filter((response) => !!response.response),
        untilDestroyed(this),
      )
      .subscribe(({ response }) => {
        this.dataProvider().expandedRow = response;
        this.dataProvider().load();
      });
  }

  onListFiltered(query: string): void {
    this.filterString = query;
    this.dataProvider().setFilter({ query, columnKeys: ['name'] });
  }
}
