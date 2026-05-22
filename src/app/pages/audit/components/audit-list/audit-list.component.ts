import { AsyncPipe } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, computed, inject, input, output,
} from '@angular/core';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCellDefDirective,
  TnHeaderCellDefDirective,
  TnIconComponent,
  TnTableColumnDirective,
  TnTableComponent,
  TnTooltipDirective,
  type TnSortEvent,
} from '@truenas/ui-components';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { auditEventLabels, auditServiceLabels } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { FormatDateTimePipe } from 'app/modules/dates/pipes/format-date-time/format-datetime.pipe';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { EmptyService } from 'app/modules/empty/empty.service';
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
    EmptyComponent,
    FormatDateTimePipe,
    GetLogImportantDataPipe,
    IxTablePagerComponent,
    TnCellDefDirective,
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
  protected emptyService = inject(EmptyService);
  private translate = inject(TranslateService);

  readonly dataProvider = input.required<AuditApiDataProvider>();

  protected readonly searchableElements = auditElements;
  protected readonly toggleShowMobileDetails = output<boolean>();
  protected readonly controllerType = computed(() => this.dataProvider().selectedControllerType);

  protected readonly displayedColumns = ['service', 'username', 'message_timestamp', 'event', 'event_data'];

  protected readonly trackByAuditId = (_: number, row: AuditEntry): string => row.audit_id;

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

    this.dataProvider().setSorting({
      propertyName: direction ? (event.column as keyof AuditEntry) : null,
      direction,
      active: 1,
    } as TableSort<AuditEntry>);
  }

  protected onRowClick(row: AuditEntry): void {
    this.dataProvider().expandedRow = row;
    this.toggleShowMobileDetails.emit(true);
  }
}
