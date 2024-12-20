import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import {
  Component, ChangeDetectionStrategy, input, output,
  Inject,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { toSvg } from 'jdenticon';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { auditServiceLabels, auditEventLabels } from 'app/enums/audit.enum';
import { ControllerType } from 'app/enums/controller-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { dateColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { auditElements } from 'app/pages/audit/audit.elements';
import { AuditSearchComponent } from 'app/pages/audit/components/audit-search/audit-search.component';
import { AuditApiDataProvider } from 'app/pages/audit/utils/audit-api-data-provider';
import { getLogImportantData } from 'app/pages/audit/utils/get-log-important-data.utils';

@UntilDestroy()
@Component({
  selector: 'ix-audit-list',
  templateUrl: './audit-list.component.html',
  styleUrls: ['./audit-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    IxTableBodyComponent,
    IxTableCellDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTablePagerComponent,
    MatTooltip,
    NgTemplateOutlet,
    UiSearchDirective,
    AuditSearchComponent,
  ],
})
export class AuditListComponent {
  protected readonly searchableElements = auditElements;
  readonly isHaLicensed = input<boolean>();
  readonly isMobileView = input<boolean>();
  readonly controllerType = input.required<ControllerType>();
  readonly toggleShowMobileDetails = output<boolean>();
  readonly dataProvider = input<AuditApiDataProvider>();

  columns = createTable<AuditEntry>([
    textColumn({
      title: this.translate.instant('Service'),
      propertyName: 'service',
      getValue: (row) => (auditServiceLabels.has(row.service)
        ? this.translate.instant(auditServiceLabels.get(row.service))
        : row.service || '-'),
    }),
    textColumn({
      title: this.translate.instant('User'),
      propertyName: 'username',
    }),
    dateColumn({
      title: this.translate.instant('Timestamp'),
      propertyName: 'message_timestamp',
      getValue: (row) => row.message_timestamp * 1000,
    }),
    textColumn({
      title: this.translate.instant('Event'),
      propertyName: 'event',
      getValue: (row) => (auditEventLabels.has(row.event)
        ? this.translate.instant(auditEventLabels.get(row.event))
        : row.event || '-'),
    }),
    textColumn({
      title: this.translate.instant('Event Data'),
      disableSorting: true,
      getValue: (row) => this.translate.instant(this.getEventDataForLog(row)),
    }),
  ], {
    uniqueRowTag: (row) => `audit-${row.service}-${row.username}-${row.event}-${row.audit_id}`,
    ariaLabels: (row) => [row.service, row.username, row.event, this.translate.instant('Audit Entry')],
  });

  constructor(
    private sanitizer: DomSanitizer,
    protected emptyService: EmptyService,
    private translate: TranslateService,
    @Inject(WINDOW) private window: Window,
  ) { }

  private getEventDataForLog(row: AuditEntry): string {
    return getLogImportantData(row, this.translate);
  }

  getUserAvatarForLog(row: AuditEntry): SafeHtml {
    // eslint-disable-next-line sonarjs/no-angular-bypass-sanitization
    return this.sanitizer.bypassSecurityTrustHtml(toSvg(row.username, this.isMobileView ? 15 : 35));
  }

  expanded(row: AuditEntry): void {
    if (!row) {
      return;
    }

    if (this.isMobileView()) {
      this.toggleShowMobileDetails.emit(true);

      // TODO: Do not rely on querying DOM elements
      // focus on details container
      setTimeout(() => (this.window.document.getElementsByClassName('mobile-back-button')[0] as HTMLElement).focus(), 0);
    }
  }
}
