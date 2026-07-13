import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, input, output, inject, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnCardComponent, TnCardHeaderActionsDirective, TnCardHeaderDirective, TnCellDefDirective, TnEmptyComponent,
  TnHeaderCellDefDirective, TnIconButtonComponent, TnTableColumnDirective, TnTableComponent, TnTablePagerComponent,
} from '@truenas/ui-components';
import { noSearchResultsConfig } from 'app/constants/empty-configs';
import { NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { searchDelayConst } from 'app/modules/global-search/constants/delay.const';
import { UiSearchDirectivesService } from 'app/modules/global-search/services/ui-search-directives.service';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { SubSystemNameCellComponent } from 'app/pages/sharing/nvme-of/subsystems-list/subsystem-name-cell/subsystem-name-cell.component';

@Component({
  selector: 'ix-subsystems-list',
  templateUrl: './subsystems-list.component.html',
  styleUrl: './subsystems-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnCardHeaderActionsDirective,
    BasicSearchComponent,
    TranslateModule,
    AsyncPipe,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnIconButtonComponent,
    TnEmptyComponent,
    TnTablePagerComponent,
    SubSystemNameCellComponent,
  ],
})
export class SubsystemsListComponent {
  private cdr = inject(ChangeDetectorRef);
  private searchDirectives = inject(UiSearchDirectivesService);

  readonly isLoading = input(false);
  readonly toggleShowMobileDetails = output<boolean>();
  readonly subsystemSelected = output<NvmeOfSubsystemDetails>();
  readonly dataProvider = input.required<ArrayDataProvider<NvmeOfSubsystemDetails>>();
  // eslint-disable-next-line @angular-eslint/no-output-native
  readonly search = output<string>();

  searchQuery = signal('');

  protected readonly noSearchResults = noSearchResultsConfig;

  protected readonly displayedColumns = ['name', 'namespaces', 'ports', 'hosts', 'actions'];

  protected readonly trackBySubsystemId = (_: number, row: NvmeOfSubsystemDetails): number => row.id;

  constructor() {
    setTimeout(() => this.handlePendingGlobalSearchElement(), searchDelayConst * 5);
  }

  protected onRowClick(row: NvmeOfSubsystemDetails): void {
    const isCurrentlyExpanded = this.dataProvider().expandedRow === row;
    if (isCurrentlyExpanded) {
      this.expanded(null);
    } else {
      this.dataProvider().expandedRow = row;
      this.expanded(row);
    }
  }

  protected expanded(subsys: NvmeOfSubsystemDetails): void {
    this.toggleShowMobileDetails.emit(!!subsys);
    if (!subsys) {
      this.dataProvider().expandedRow = null;
      this.cdr.markForCheck();
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
