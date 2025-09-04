import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, output, inject, signal, computed } from '@angular/core';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { noSearchResultsConfig, nvmeOfEmptyConfig } from 'app/constants/empty-configs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
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
import { SubSystemNameCellComponent } from 'app/pages/sharing/nvme-of/subsystems-list/subsystem-name-cell/subsystem-name-cell.component';

@UntilDestroy()
@Component({
  selector: 'ix-subsystems-list',
  templateUrl: './subsystems-list.component.html',
  styleUrl: './subsystems-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    FakeProgressBarComponent,
    BasicSearchComponent,
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
    SubSystemNameCellComponent,
    EmptyComponent,
  ],
})
export class SubsystemsListComponent {
  protected emptyService = inject(EmptyService);
  private translate = inject(TranslateService);
  private cdr = inject(ChangeDetectorRef);
  private searchDirectives = inject(UiSearchDirectivesService);

  readonly isMobileView = input<boolean>();
  readonly isLoading = input(false);
  readonly toggleShowMobileDetails = output<boolean>();
  readonly subsystemSelected = output<NvmeOfSubsystemDetails>();
  readonly dataProvider = input.required<ArrayDataProvider<NvmeOfSubsystemDetails>>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly search = output<string>();
  protected readonly EmptyType = EmptyType;

  searchQuery = signal('');

  protected readonly emptyConfig = computed<EmptyConfig>(() => {
    if (this.searchQuery()?.length) {
      return noSearchResultsConfig;
    }

    return nvmeOfEmptyConfig;
  });

  protected columns = createTable<NvmeOfSubsystemDetails>([
    templateColumn({
      title: this.translate.instant('Name'),
    }),
    textColumn({
      title: this.translate.instant('Namespaces'),
      getValue: (row: NvmeOfSubsystemDetails) => {
        return row.namespaces.length;
      },
    }),
    textColumn({
      title: this.translate.instant('Ports'),
      getValue: (row) => {
        return row.ports.length;
      },
    }),
    textColumn({
      title: this.translate.instant('Hosts'),
      getValue: (row) => {
        return row.hosts.length;
      },
    }),
    templateColumn({
      cssClass: 'view-details-column',
    }),
  ], {
    uniqueRowTag: (row) => 'nvmeof-subsys-' + row.name,
    ariaLabels: (row) => [row.name, this.translate.instant('Subsystem')],
  });

  constructor() {
    setTimeout(() => this.handlePendingGlobalSearchElement(), searchDelayConst * 5);
  }

  protected expanded(subsys: NvmeOfSubsystemDetails): void {
    if (this.isMobileView()) {
      this.toggleShowMobileDetails.emit(!!subsys);
      if (!subsys) {
        this.dataProvider().expandedRow = null;
        this.cdr.markForCheck();
      }
    }
    if (subsys) {
      this.subsystemSelected.emit(subsys);
    }
  }

  protected onListFiltered(query: string): void {
    this.searchQuery.set(query);
    this.search.emit(query);
  }

  private handlePendingGlobalSearchElement(): void {
    const pendingHighlightElement = this.searchDirectives.pendingUiHighlightElement;

    if (pendingHighlightElement) {
      this.searchDirectives.get(pendingHighlightElement)?.highlight(pendingHighlightElement);
    }
  }
}
