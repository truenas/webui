import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, Inject, OnDestroy, OnInit,
  signal,
  viewChild,
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

  protected dataProvider = new AuditApiDataProvider(this.api, {
    paginationStrategy: new PaginationServerSide(),
    sortingStrategy: new SortingServerSide(),
  });

  protected readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  protected readonly ControllerType = ControllerType;
  protected readonly auditEventLabels = auditEventLabels;

  masterDetailView = viewChild(MasterDetailViewComponent);
  searchQuery: SearchQuery<AuditEntry>;
  pagination: TablePagination;

  constructor(
    private api: ApiService,
    protected emptyService: EmptyService,
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
    this.setDefaultSort();
    this.dataProvider.load();
    this.dataProvider.currentPage$.pipe(filter(Boolean), untilDestroyed(this)).subscribe((auditEntries) => {
      this.dataProvider.expandedRow = this.masterDetailView().isMobileView() ? null : auditEntries[0];
      this.cdr.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.dataProvider.unsubscribe();
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

  private setDefaultSort(): void {
    this.dataProvider.setSorting({
      propertyName: 'message_timestamp',
      direction: SortDirection.Desc,
      active: 1,
    });
  }
}
