import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { AuditEntry } from 'app/interfaces/audit.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { dateColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-date/ix-cell-date.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { ManageViewsComponent } from 'app/pages/audit/components/manage-views/manage-views.component';
import { SetupColumnsComponent } from 'app/pages/audit/components/setup-columns/setup-columns.component';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuditComponent implements OnInit {
  protected readonly searchControl = new FormControl();
  protected dataProvider = new ArrayDataProvider<AuditEntry>();
  columns = createTable<AuditEntry>('audit', [
    dateColumn({
      title: this.translate.instant('Event Time'),
      propertyName: 'timestamp',
    }),
    textColumn({
      title: this.translate.instant('Event'),
      propertyName: 'event',
    }),
    textColumn({
      title: this.translate.instant('Address'),
      propertyName: 'address',
    }),
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'username',
    }),
  ]);

  constructor(
    private matDialog: MatDialog,
    private translate: TranslateService,
    private ws: WebSocketService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadEntries();
  }

  onManageViewsPressed(): void {
    this.matDialog.open(ManageViewsComponent);
  }

  onExport(): void {

  }

  onSetupColumns(): void {
    this.matDialog.open(SetupColumnsComponent);
  }

  private loadEntries(): void {
    this.ws.call('audit.query').pipe(untilDestroyed(this)).subscribe((entries) => {
      this.dataProvider.setRows(entries);
      this.cdr.markForCheck();
    });
  }
}
