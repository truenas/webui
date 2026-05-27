import { AsyncPipe } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, input, output,
} from '@angular/core';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnCellDefDirective,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTablePagerComponent,
  TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { auditElements } from 'app/pages/audit/audit.elements';
import { AuditSearchComponent } from 'app/pages/audit/components/audit-search/audit-search.component';
import { AuditApiDataProvider } from 'app/pages/audit/utils/audit-api-data-provider';
import { AuditEventLabelPipe } from 'app/pages/audit/utils/audit-event-label.pipe';
import { AuditServiceLabelPipe } from 'app/pages/audit/utils/audit-service-label.pipe';
import { GetLogImportantDataPipe } from 'app/pages/audit/utils/get-log-important-data.pipe';
import { UserAvatarPipe } from 'app/pages/audit/utils/user-avatar.pipe';

export const auditDisplayedColumns: string[] = ['service', 'username', 'message_timestamp', 'event', 'event_data'];

interface EmptyAttrs {
  title: string;
  icon: string;
}

const loadingTitle = T('Loading…');

const emptyTypeAttrs = new Map<EmptyType, EmptyAttrs>([
  [EmptyType.Loading, { title: loadingTitle, icon: 'mdi-loading' }],
  [EmptyType.Errors, { title: T('Cannot retrieve response'), icon: 'mdi-alert-octagon' }],
  [EmptyType.NoSearchResults, { title: T('No Search Results.'), icon: 'mdi-magnify-scan' }],
  [EmptyType.FirstUse, { title: T('No records have been added yet'), icon: 'mdi-format-list-text' }],
  [EmptyType.NoPageData, { title: T('No records have been added yet'), icon: 'mdi-format-list-text' }],
]);

const defaultEmptyAttrs: EmptyAttrs = {
  title: T('No records have been added yet'),
  icon: 'mdi-format-list-text',
};

@Component({
  selector: 'ix-audit-list',
  templateUrl: './audit-list.component.html',
  styleUrls: ['./audit-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    AuditEventLabelPipe,
    AuditSearchComponent,
    AuditServiceLabelPipe,
    IxDateComponent,
    GetLogImportantDataPipe,
    TnCellDefDirective,
    TnHeaderCellDefDirective,
    TnIconComponent,
    TnTableColumnDirective,
    TnTableComponent,
    TnTablePagerComponent,
    TnTooltipDirective,
    TranslateModule,
    UiSearchDirective,
    UserAvatarPipe,
  ],
})
export class AuditListComponent {
  readonly dataProvider = input.required<AuditApiDataProvider>();

  protected readonly searchableElements = auditElements;
  readonly toggleShowMobileDetails = output<boolean>();
  readonly rowSelected = output<AuditEntry>();

  protected readonly displayedColumns = auditDisplayedColumns;
  protected readonly loadingTitle = loadingTitle;

  protected emptyAttrsFor(type: EmptyType | null | undefined): EmptyAttrs {
    return (type && emptyTypeAttrs.get(type)) ?? defaultEmptyAttrs;
  }

  protected readonly trackByAuditId = (_index: number, row: AuditEntry): string => row.audit_id;

  protected onSortChange(event: TnSortEvent): void {
    this.dataProvider().setSorting(mapTnSortToTableSort<AuditEntry>(event, this.displayedColumns));
  }

  protected onRowClick(row: AuditEntry): void {
    this.rowSelected.emit(row);
    this.toggleShowMobileDetails.emit(true);
  }
}
