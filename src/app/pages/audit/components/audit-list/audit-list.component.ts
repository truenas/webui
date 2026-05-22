import { AsyncPipe } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, computed, inject, input, output,
} from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCellDefDirective,
  TnEmptyComponent,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { auditEventLabels, auditServiceLabels } from 'app/enums/audit.enum';
import { EmptyType } from 'app/enums/empty-type.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { TableSort } from 'app/modules/ix-table/interfaces/table-sort.interface';
import { auditElements } from 'app/pages/audit/audit.elements';
import { AuditSearchComponent } from 'app/pages/audit/components/audit-search/audit-search.component';
import { AuditApiDataProvider } from 'app/pages/audit/utils/audit-api-data-provider';
import { GetLogImportantDataPipe } from 'app/pages/audit/utils/get-log-important-data.pipe';
import { UserAvatarPipe } from 'app/pages/audit/utils/user-avatar.pipe';

@Component({
  selector: 'ix-audit-list',
  templateUrl: './audit-list.component.html',
  styleUrls: ['./audit-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    AuditSearchComponent,
    IxDateComponent,
    GetLogImportantDataPipe,
    IxTablePagerComponent,
    TnCellDefDirective,
    TnEmptyComponent,
    TnHeaderCellDefDirective,
    TnIconComponent,
    TnTableColumnDirective,
    TnTableComponent,
    TnTooltipDirective,
    TranslateModule,
    UiSearchDirective,
    UserAvatarPipe,
  ],
})
export class AuditListComponent {
  private translate = inject(TranslateService);

  readonly dataProvider = input.required<AuditApiDataProvider>();

  protected readonly searchableElements = auditElements;
  protected readonly toggleShowMobileDetails = output<boolean>();
  protected readonly controllerType = computed(() => this.dataProvider().selectedControllerType);

  protected readonly displayedColumns = ['service', 'username', 'message_timestamp', 'event', 'event_data'];

  protected readonly trackByAuditId = (_index: number, row: AuditEntry): string => row.audit_id;

  protected getServiceLabel(row: AuditEntry): string {
    const service = auditServiceLabels.get(row.service);
    return service ? this.translate.instant(service) : row.service || '-';
  }

  protected getEventLabel(row: AuditEntry): string {
    const event = auditEventLabels.get(row.event);
    return event ? this.translate.instant(event) : row.event || '-';
  }

  protected onSortChange(event: TnSortEvent): void {
    let direction: SortDirection | null = null;
    if (event.direction === 'asc') direction = SortDirection.Asc;
    else if (event.direction === 'desc') direction = SortDirection.Desc;

    const columnIndex = this.displayedColumns.indexOf(event.column);
    const sorting: TableSort<AuditEntry> = {
      propertyName: direction ? (event.column as keyof AuditEntry) : null,
      direction,
      active: direction && columnIndex >= 0 ? columnIndex : null,
    };
    this.dataProvider().setSorting(sorting);
  }

  protected onRowClick(row: AuditEntry): void {
    if (!row) {
      return;
    }
    this.dataProvider().expandedRow = row;
    this.toggleShowMobileDetails.emit(true);
  }

  protected getEmptyAttrs(emptyType: EmptyType | null): { title: string; description?: string; icon: string } {
    switch (emptyType) {
      case EmptyType.Loading:
        return { title: T('Loading...'), icon: 'mdi-loading' };
      case EmptyType.Errors:
        return { title: T('Cannot retrieve response'), icon: 'mdi-alert-octagon' };
      case EmptyType.NoSearchResults:
        return {
          title: T('No Search Results.'),
          description: T('No matching results found'),
          icon: 'mdi-magnify-scan',
        };
      case EmptyType.FirstUse:
      case EmptyType.NoPageData:
      default:
        return { title: T('No records have been added yet'), icon: 'mdi-format-list-text' };
    }
  }
}
