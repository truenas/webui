import { BreakpointObserver, BreakpointState, Breakpoints } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, Inject, OnDestroy, OnInit,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatAnchor } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleChange, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  filter,
} from 'rxjs';
import { auditEventLabels } from 'app/enums/audit.enum';
import { ControllerType } from 'app/enums/controller-type.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import {
  SearchQuery,
} from 'app/modules/forms/search-input/types/search-query.interface';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table/classes/api-data-provider/sorting-server-side.class';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { TablePagination } from 'app/modules/ix-table/interfaces/table-pagination.interface';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { auditElements } from 'app/pages/audit/audit.elements';
import { AuditListComponent } from 'app/pages/audit/components/audit-list/audit-list.component';
import { LogDetailsPanelComponent } from 'app/pages/audit/components/log-details-panel/log-details-panel.component';
import { AuditApiDataProvider } from 'app/pages/audit/utils/audit-api-data-provider';
import { ApiService } from 'app/services/websocket/api.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    MatButtonToggleGroup,
    TestDirective,
    MatAnchor,
    RouterLink,
    MatButtonToggle,
    LogDetailsPanelComponent,
    TranslateModule,
    MasterDetailViewComponent,
    AuditListComponent,
  ],
})
export class AuditComponent implements OnInit, OnDestroy {
  protected readonly searchableElements = auditElements;
  protected readonly controllerType = signal<ControllerType>(ControllerType.Active);

  protected dataProvider: AuditApiDataProvider;
  protected readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  protected readonly ControllerType = ControllerType;
  protected readonly auditEventLabels = auditEventLabels;

  showMobileDetails = false;
  isMobileView = false;
  searchQuery: SearchQuery<AuditEntry>;
  pagination: TablePagination;

  constructor(
    private api: ApiService,
    protected emptyService: EmptyService,
    private breakpointObserver: BreakpointObserver,
    private cdr: ChangeDetectorRef,
    private store$: Store<AppState>,
    @Inject(WINDOW) private window: Window,
  ) {
    effect(() => {
      this.dataProvider.selectedControllerType = this.controllerType();
      this.dataProvider.isHaLicensed = this.isHaLicensed();

      this.dataProvider.load();
    });
  }

  ngOnInit(): void {
    this.dataProvider = new AuditApiDataProvider(this.api);
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();
    this.setDefaultSort();

    this.getAuditLogs();

    this.dataProvider.currentPage$.pipe(filter(Boolean), untilDestroyed(this)).subscribe((auditEntries) => {
      this.dataProvider.expandedRow = this.isMobileView ? null : auditEntries[0];
      this.expanded(this.dataProvider.expandedRow);
      this.cdr.markForCheck();
    });

    this.initMobileView();
  }

  ngOnDestroy(): void {
    this.dataProvider.unsubscribe();
  }

  closeMobileDetails(): void {
    this.showMobileDetails = false;
    this.dataProvider.expandedRow = null;
    this.cdr.markForCheck();
  }

  expanded(row: AuditEntry): void {
    if (!row) {
      return;
    }

    if (this.isMobileView) {
      this.showMobileDetails = true;
      this.cdr.markForCheck();

      // TODO: Do not rely on querying DOM elements
      // focus on details container
      setTimeout(() => (this.window.document.getElementsByClassName('mobile-back-button')[0] as HTMLElement).focus(), 0);
    }
  }

  controllerTypeChanged(changedValue: MatButtonToggleChange): void {
    if (this.controllerType() === changedValue.value) {
      return;
    }

    if (this.controllerType() === ControllerType.Active && changedValue.value === ControllerType.Standby) {
      this.controllerType.set(ControllerType.Standby);
    } else {
      this.controllerType.set(ControllerType.Active);
    }
  }

  private initMobileView(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small, Breakpoints.Medium])
      .pipe(untilDestroyed(this))
      .subscribe((state: BreakpointState) => {
        if (state.matches) {
          this.isMobileView = true;
          if (this.dataProvider.expandedRow) {
            this.expanded(this.dataProvider.expandedRow);
          } else {
            this.closeMobileDetails();
          }
        } else {
          this.isMobileView = false;
        }
        this.cdr.markForCheck();
      });
  }

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      propertyName: 'message_timestamp',
      direction: SortDirection.Desc,
      active: 1,
    });
  }

  private getAuditLogs(): void {
    this.dataProvider.load();
  }
}
