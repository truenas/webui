import { AsyncPipe } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, computed, input, output,
} from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
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
import {
  AuditEvent, auditEventLabels, AuditService, auditServiceLabels,
} from 'app/enums/audit.enum';
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

interface EmptyAttrs {
  title: string;
  description: string;
  icon: string;
}

const emptyTypeAttrs = new Map<EmptyType, EmptyAttrs>([
  [EmptyType.Loading, { title: T('Loading…'), description: '', icon: 'mdi-loading' }],
  [EmptyType.Errors, { title: T('Cannot retrieve response'), description: '', icon: 'mdi-alert-octagon' }],
  [EmptyType.NoSearchResults, {
    title: T('No Search Results.'),
    description: T('No matching results found'),
    icon: 'mdi-magnify-scan',
  }],
  [EmptyType.FirstUse, {
    title: T('No records have been added yet'), description: '', icon: 'mdi-format-list-text',
  }],
  [EmptyType.NoPageData, {
    title: T('No records have been added yet'), description: '', icon: 'mdi-format-list-text',
  }],
]);

const defaultEmptyAttrs: EmptyAttrs = {
  title: T('No records have been added yet'),
  description: '',
  icon: 'mdi-format-list-text',
};

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
  readonly dataProvider = input.required<AuditApiDataProvider>();

  protected readonly searchableElements = auditElements;
  protected readonly toggleShowMobileDetails = output<boolean>();
  protected readonly rowSelected = output<AuditEntry>();
  protected readonly controllerType = computed(() => this.dataProvider().selectedControllerType);

  protected readonly displayedColumns = ['service', 'username', 'message_timestamp', 'event', 'event_data'];
  protected readonly statusIconSize = '15px';

  protected readonly trackByAuditId = (_index: number, row: AuditEntry): string => row.audit_id;

  protected getServiceLabel(row: AuditEntry): string {
    return auditServiceLabels.get(row.service as AuditService) || row.service || '-';
  }

  protected getEventLabel(row: AuditEntry): string {
    return auditEventLabels.get(row.event as AuditEvent) || row.event || '-';
  }

  protected onSortChange(event: TnSortEvent): void {
    let direction: SortDirection | null = null;
    if (event.direction === 'asc') {
      direction = SortDirection.Asc;
    } else if (event.direction === 'desc') {
      direction = SortDirection.Desc;
    }

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
    this.rowSelected.emit(row);
    this.toggleShowMobileDetails.emit(true);
  }

  protected getEmptyAttrs(emptyType: EmptyType | null): EmptyAttrs {
    return emptyTypeAttrs.get(emptyType as EmptyType) ?? defaultEmptyAttrs;
  }
}
