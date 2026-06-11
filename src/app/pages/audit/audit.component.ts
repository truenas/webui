import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, OnDestroy, OnInit, viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FormControl } from '@ngneat/reactive-forms';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnButtonToggleComponent, TnButtonToggleGroupComponent } from '@truenas/ui-components';
import {
  combineLatest, distinctUntilChanged, filter, map, skip, tap,
} from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { ControllerType, controllerTypeLabels } from 'app/enums/controller-type.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { generateUuid } from 'app/helpers/uuid.helper';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table/classes/api-data-provider/sorting-server-side.class';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { auditElements } from 'app/pages/audit/audit.elements';
import { auditDisplayedColumns, AuditListComponent } from 'app/pages/audit/components/audit-list/audit-list.component';
import { LogDetailsPanelComponent } from 'app/pages/audit/components/log-details-panel/log-details-panel.component';
import { AuditApiDataProvider } from 'app/pages/audit/utils/audit-api-data-provider';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

// Cache once at module scope — `auditDisplayedColumns` is a frozen module constant,
// so this index can never go stale.
const messageTimestampColumnIndex = auditDisplayedColumns.indexOf('message_timestamp');

@Component({
  selector: 'ix-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    RouterLink,
    TnButtonComponent,
    TnButtonToggleGroupComponent,
    TnButtonToggleComponent,
    LogDetailsPanelComponent,
    TranslateModule,
    MasterDetailViewComponent,
    AuditListComponent,
    ReactiveFormsModule,
    UiSearchDirective,
  ],
})
export class AuditComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);

  protected dataProvider: AuditApiDataProvider;

  protected readonly masterDetailView = viewChild.required(MasterDetailViewComponent);
  protected readonly controllerTypeControl = new FormControl<ControllerType>(ControllerType.Active);
  protected readonly controllerTypeOptions = mapToOptions(controllerTypeLabels, this.translate);
  protected readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  private readonly isHaLicensed$ = toObservable(this.isHaLicensed);
  protected readonly searchableElements = auditElements;
  // Unique id per instance so the aria-labelledby relationship still works
  // if multiple AuditComponent instances ever coexist (e.g. in tabs/dialogs).
  protected readonly controllerToggleLabelId = `audit-controller-toggle-label-${generateUuid()}`;

  ngOnInit(): void {
    this.createDataProvider();
    this.syncControllerStateToDataProvider();
  }

  ngOnDestroy(): void {
    // Guard against teardown running before `createDataProvider` assigned it
    // (e.g. if ngOnInit threw), which would otherwise mask the original error.
    this.dataProvider?.unsubscribe();
  }

  /**
   * Creates and configures the data provider for audit entries.
   * Note: Initial data loading is delegated to AuditSearchComponent
   * to prevent duplicate API calls.
   */
  private createDataProvider(): void {
    this.dataProvider = new AuditApiDataProvider(this.api);
    this.dataProvider.paginationStrategy = new PaginationServerSide();
    this.dataProvider.sortingStrategy = new SortingServerSide();
    this.dataProvider.setSorting({
      propertyName: 'message_timestamp',
      direction: SortDirection.Desc,
      active: messageTimestampColumnIndex,
    }, true);
    this.dataProvider.currentPage$
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe((auditEntries) => {
        this.dataProvider.expandedRow = this.masterDetailView().isMobileView() ? null : auditEntries[0];
        this.cdr.markForCheck();
      });
  }

  /**
   * Pushes controller type / HA license into the data provider, then reloads on subsequent changes.
   * The first emission is consumed silently — AuditSearchComponent owns the initial fetch — and
   * only subsequent changes trigger a reload.
   */
  private syncControllerStateToDataProvider(): void {
    combineLatest([
      this.controllerTypeControl.value$,
      this.isHaLicensed$.pipe(map(Boolean)),
    ]).pipe(
      distinctUntilChanged(
        ([prevType, prevHa], [nextType, nextHa]) => prevType === nextType && prevHa === nextHa,
      ),
      tap(([controllerType, isHaLicensed]) => {
        this.dataProvider.selectedControllerType = controllerType;
        this.dataProvider.isHaLicensed = isHaLicensed;
      }),
      skip(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.dataProvider.load();
    });
  }
}
