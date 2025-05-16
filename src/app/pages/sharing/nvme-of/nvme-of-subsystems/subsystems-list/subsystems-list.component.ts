import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input, output,
} from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { templateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-template/ix-cell-template.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { subsystemListElements } from 'app/pages/sharing/nvme-of/nvme-of-subsystems/nvme-of-subsystems.elements';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/nvme-of.store';

@UntilDestroy()
@Component({
  selector: 'ix-subsystems-list',
  templateUrl: './subsystems-list.component.html',
  styleUrl: './subsystems-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    FakeProgressBarComponent,
    SearchInput1Component,
    TranslateModule,
    AsyncPipe,
    MatToolbarRow,
    MatCardContent,
    IxTableComponent,
    IxTableHeadComponent,
    IxTableBodyComponent,
    IxTableCellDirective,
    IxIconComponent,
    IxTableEmptyDirective,
    IxTablePagerComponent,
  ],
})
export class SubsystemsListComponent {
  readonly isMobileView = input<boolean>();
  readonly toggleShowMobileDetails = output<boolean>();
  readonly dataProvider = input.required<ArrayDataProvider<NvmeOfSubsystem>>();
  readonly search = output<string>();

  protected readonly searchableElements = subsystemListElements;

  protected readonly requiredRoles = [
    Role.SharingNvmeTargetRead,
    Role.SharingNvmeTargetWrite,
    Role.SharingWrite,
  ];

  filterString = '';

  protected columns = createTable<NvmeOfSubsystem>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Namespaces'),
      getValue: (row: NvmeOfSubsystem) => {
        return this.nvmeOfStore.getSubsystemNamespaces(row);
      },
    }),
    textColumn({
      title: this.translate.instant('Hosts'),
      getValue: (row) => {
        return this.nvmeOfStore.getSubsystemHosts(row);
      },
    }),
    textColumn({
      title: this.translate.instant('Ports'),
      getValue: (row) => {
        return this.nvmeOfStore.getSubsystemPorts(row);
      },
    }),
    templateColumn({
      cssClass: 'view-details-column',
    }),
  ], {
    uniqueRowTag: (row) => 'nvmeof-subsys-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Subsystem')],
  });

  constructor(
    protected emptyService: EmptyService,
    private slideIn: SlideIn,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private nvmeOfStore: NvmeOfStore,
  ) { }

  protected expanded(subsys: NvmeOfSubsystem): void {
    if (this.isMobileView()) {
      this.toggleShowMobileDetails.emit(!!subsys);
      if (!subsys) {
        this.dataProvider().expandedRow = null;
        this.cdr.markForCheck();
      }
    }
  }

  protected onListFiltered(query: string): void {
    this.filterString = query;
    this.search.emit(query);
  }
}
