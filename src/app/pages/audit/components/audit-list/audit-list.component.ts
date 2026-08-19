import { AsyncPipe } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, inject, input, output,
} from '@angular/core';
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
import { EmptyService } from 'app/modules/empty/empty.service';
import { mapTnSortToTableSort } from 'app/modules/ix-table/utils';
import { auditElements } from 'app/pages/audit/audit.elements';
import { AuditSearchComponent } from 'app/pages/audit/components/audit-search/audit-search.component';
import { AuditApiDataProvider } from 'app/pages/audit/utils/audit-api-data-provider';
import { AuditServiceLabelPipe } from 'app/pages/audit/utils/audit-service-label.pipe';
import { GetLogImportantDataPipe } from 'app/pages/audit/utils/get-log-important-data.pipe';
import { UserAvatarPipe } from 'app/pages/audit/utils/user-avatar.pipe';

// Frozen so the module-scope index cached in audit.component.ts stays valid — the
// declared `string[]` type is kept for tn-table's `displayedColumns` input.
export const auditDisplayedColumns: string[] = Object.freeze([
  'service', 'username', 'message_timestamp', 'event', 'event_data',
]) as string[];

/**
 * The only page-specific half of an empty state: its icon. Audit's glyphs deliberately differ from
 * {@link EmptyService.iconForType} — a spinner while loading, the list icon rather than a rocket
 * for a first use no one can act on (audit records are written by the system, not added by a user).
 * Both the title and the body copy come from {@link EmptyService}, which owns the one place each
 * state's copy is written.
 */
const emptyTypeIcons = new Map<EmptyType, string>([
  [EmptyType.Loading, 'mdi-loading'],
  [EmptyType.Errors, 'mdi-alert-octagon'],
  [EmptyType.NoSearchResults, 'mdi-magnify-scan'],
  [EmptyType.FirstUse, 'mdi-format-list-text'],
  [EmptyType.NoPageData, 'mdi-format-list-text'],
]);

const defaultEmptyIcon = 'mdi-format-list-text';

@Component({
  selector: 'ix-audit-list',
  templateUrl: './audit-list.component.html',
  styleUrls: ['./audit-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
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
  protected readonly emptyService = inject(EmptyService);

  readonly dataProvider = input.required<AuditApiDataProvider>();

  protected readonly searchableElements = auditElements;
  readonly toggleShowMobileDetails = output<boolean>();
  readonly rowSelected = output<AuditEntry>();

  protected readonly displayedColumns = auditDisplayedColumns;

  protected emptyIconFor(type: EmptyType | null | undefined): string {
    return (type && emptyTypeIcons.get(type)) ?? defaultEmptyIcon;
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
