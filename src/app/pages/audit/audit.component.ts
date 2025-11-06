import { ChangeDetectionStrategy, ChangeDetectorRef, Component, effect, OnDestroy, OnInit, viewChild, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAnchor } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { FormControl } from '@ngneat/reactive-forms';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter,
  of,
} from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { ControllerType, controllerTypeLabels } from 'app/enums/controller-type.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxButtonGroupComponent } from 'app/modules/forms/ix-forms/components/ix-button-group/ix-button-group.component';
import { PaginationServerSide } from 'app/modules/ix-table/classes/api-data-provider/pagination-server-side.class';
import { SortingServerSide } from 'app/modules/ix-table/classes/api-data-provider/sorting-server-side.class';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { MasterDetailViewComponent } from 'app/modules/master-detail-view/master-detail-view.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { auditElements } from 'app/pages/audit/audit.elements';
import { AuditListComponent } from 'app/pages/audit/components/audit-list/audit-list.component';
import { LogDetailsPanelComponent } from 'app/pages/audit/components/log-details-panel/log-details-panel.component';
import { AuditApiDataProvider } from 'app/pages/audit/utils/audit-api-data-provider';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-audit',
  templateUrl: './audit.component.html',
  styleUrls: ['./audit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    TestDirective,
    MatAnchor,
    RouterLink,
    LogDetailsPanelComponent,
    TranslateModule,
    MasterDetailViewComponent,
    AuditListComponent,
    IxButtonGroupComponent,
    ReactiveFormsModule,
    UiSearchDirective,
  ],
})
export class AuditComponent implements OnInit, OnDestroy {
  private api = inject(ApiService);
  protected emptyService = inject(EmptyService);
  private cdr = inject(ChangeDetectorRef);
  private store$ = inject<Store<AppState>>(Store);
  private translate = inject(TranslateService);

  protected dataProvider: AuditApiDataProvider;
  private hasInitialized = false;

  protected readonly masterDetailView = viewChild.required(MasterDetailViewComponent);
  protected readonly controllerTypeControl = new FormControl<ControllerType>(ControllerType.Active);
  protected readonly controllerTypeOptions$ = of(mapToOptions(controllerTypeLabels, this.translate));
  protected readonly controllerType = toSignal(this.controllerTypeControl.value$);
  protected readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  protected readonly searchableElements = auditElements;

  /**
   * Effect to handle controller type and HA license changes.
   * Initial load is handled by AuditSearchComponent.loadParamsFromRoute()
   * to avoid duplicate API calls with empty search parameters.
   */
  constructor() {
    effect(() => {
      if (!this.dataProvider) {
        return; // DataProvider not yet initialized
      }

      const controllerType = this.controllerType();
      const isHaLicensed = this.isHaLicensed();

      // Check if values actually changed from what's already set
      const controllerTypeChanged = this.dataProvider.selectedControllerType !== controllerType;
      const isHaLicensedChanged = this.dataProvider.isHaLicensed !== Boolean(isHaLicensed);

      // Set the values on the data provider
      this.dataProvider.selectedControllerType = controllerType;
      this.dataProvider.isHaLicensed = Boolean(isHaLicensed);

      // Skip the initial load - let AuditSearchComponent handle it
      if (!this.hasInitialized) {
        this.hasInitialized = true;
        return;
      }

      // Only reload if values actually changed
      if (controllerTypeChanged || isHaLicensedChanged) {
        this.dataProvider.load();
      }
    });
  }

  ngOnInit(): void {
    this.createDataProvider();
  }

  ngOnDestroy(): void {
    this.dataProvider.unsubscribe();
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
      active: 1,
    }, true);
    this.dataProvider.currentPage$.pipe(filter(Boolean), untilDestroyed(this)).subscribe((auditEntries) => {
      this.dataProvider.expandedRow = this.masterDetailView().isMobileView() ? null : auditEntries[0];
      this.cdr.markForCheck();
    });
  }
}
