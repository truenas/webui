import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { AppCommonModule } from 'app/modules/common/app-common.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxDynamicFormModule } from 'app/modules/ix-dynamic-form/ix-dynamic-form.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AppsRoutingModule } from 'app/pages/apps/apps-routing.module';
import { AppsToolbarButtonsComponent } from 'app/pages/apps/components/available-apps/apps-toolbar-buttons/apps-toolbar-buttons.component';
import {
  CatalogAddFormComponent,
} from 'app/pages/apps/components/catalogs/catalog-add-form/catalog-add-form.component';
import {
  CatalogEditFormComponent,
} from 'app/pages/apps/components/catalogs/catalog-edit-form/catalog-edit-form.component';
import { CatalogsComponent } from 'app/pages/apps/components/catalogs/catalogs.component';
import {
  ManageCatalogSummaryDialogComponent,
} from 'app/pages/apps/components/catalogs/manage-catalog-summary/manage-catalog-summary-dialog.component';
import { ChartWizardComponent } from 'app/pages/apps/components/chart-wizard/chart-wizard.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { PodLogsComponent } from 'app/pages/apps/components/installed-apps/pod-logs/pod-logs.component';
import { PodShellComponent } from 'app/pages/apps/components/installed-apps/pod-shell/pod-shell.component';
import { PodSelectLogsDialogComponent } from 'app/pages/apps/components/pod-select-logs/pod-select-logs-dialog.component';
import { PodSelectDialogComponent } from 'app/pages/apps/components/pod-select/pod-select-dialog.component';
import { CustomFormsModule } from 'app/pages/apps/modules/custom-forms/custom-forms.module';
import { AvailableAppsStore } from 'app/pages/apps/store/available-apps-store.service';
import { AppCardLogoComponent } from './components/app-card-logo/app-card-logo.component';
import { AppDetailViewComponent } from './components/app-detail-view/app-detail-view.component';
import { AppRouterOutletComponent } from './components/app-router-outlet/app-router-outlet.component';
import { AppAvailableInfoCardComponent } from './components/available-apps/app-available-info-card/app-available-info-card.component';
import { AppCardComponent } from './components/available-apps/app-card/app-card.component';
import { AppHelmChartCardComponent } from './components/available-apps/app-helm-chart-card/app-helm-chart-card.component';
import { AppResourcesCardComponent } from './components/available-apps/app-resources-card/app-resources-card.component';
import { AvailableAppsHeaderComponent } from './components/available-apps/available-apps-header/available-apps-header.component';
import { AvailableAppsComponent } from './components/available-apps/available-apps.component';
import { AppContainersCardComponent } from './components/installed-apps/app-containers-card/app-containers-card.component';
import { AppDetailsPanelComponent } from './components/installed-apps/app-details-panel/app-details-panel.component';
import { AppHistoryCardComponent } from './components/installed-apps/app-history-card/app-history-card.component';
import { AppNotesCardComponent } from './components/installed-apps/app-notes-card/app-notes-card.component';
import { AppStatusCellComponent } from './components/installed-apps/app-status-cell/app-status-cell.component';
import { AppUpgradeDialogComponent } from './components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { InstalledAppsComponent } from './components/installed-apps/installed-apps.component';

@NgModule({
  declarations: [
    InstalledAppsComponent,
    AvailableAppsComponent,
    AvailableAppsHeaderComponent,
    CatalogsComponent,
    ChartWizardComponent,
    ManageCatalogSummaryDialogComponent,
    CatalogEditFormComponent,
    CatalogAddFormComponent,
    AppCardComponent,
    AppDetailViewComponent,
    AppCardLogoComponent,
    AppRouterOutletComponent,
    AppInfoCardComponent,
    AppRowComponent,
    AppDetailsPanelComponent,
    AppContainersCardComponent,
    AppHistoryCardComponent,
    AppNotesCardComponent,
    AppResourcesCardComponent,
    AppHelmChartCardComponent,
    AppAvailableInfoCardComponent,
    PodLogsComponent,
    PodShellComponent,
    PodSelectDialogComponent,
    PodSelectLogsDialogComponent,
    AppUpgradeDialogComponent,
    AppsToolbarButtonsComponent,
    AppStatusCellComponent,
  ],
  imports: [
    CommonModule,
    AppsRoutingModule,
    PageHeaderModule,
    MatButtonModule,
    TranslateModule,
    IxDynamicFormModule,
    ReactiveFormsModule,
    EntityModule,
    MatCardModule,
    CoreComponents,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressSpinnerModule,
    FormsModule,
    MatDialogModule,
    MatMenuModule,
    ImgFallbackModule,
    NgxSkeletonLoaderModule,
    IxIconModule,
    FlexLayoutModule,
    LazyLoadImageModule,
    TestIdModule,
    AppLoaderModule,
    AppCommonModule,
    MatExpansionModule,
    CastModule,
    TerminalModule,
    MatTooltipModule,
    MatMenuModule,
    CustomFormsModule,
  ],
  providers: [
    AvailableAppsStore,
  ],
})
export class AppsModule { }
