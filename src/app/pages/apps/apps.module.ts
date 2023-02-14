import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { LazyLoadImageModule } from 'ng-lazyload-image';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { CoreComponents } from 'app/core/core-components.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxDynamicFormModule } from 'app/modules/ix-dynamic-form/ix-dynamic-form.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AppsRoutingModule } from 'app/pages/apps/apps-routing.module';
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
import { ChartFormComponent } from 'app/pages/apps/components/chart-form/chart-form.component';
import { AppCardLogoComponent } from './components/app-card-logo/app-card-logo.component';
import { AppDetailViewComponent } from './components/app-detail-view/app-detail-view.component';
import { AppInfoCardComponent } from './components/app-info-card/app-info-card.component';
import { AppRouterOutletComponent } from './components/app-router-outlet/app-router-outlet.component';
import { AppCardComponent } from './components/available-apps/app-card/app-card.component';
import { AvailableAppsHeaderComponent } from './components/available-apps/available-apps-header/available-apps-header.component';
import { AvailableAppsComponent } from './components/available-apps/available-apps.component';
import { InstalledAppsComponent } from './components/installed-apps/installed-apps.component';

@NgModule({
  declarations: [
    InstalledAppsComponent,
    AvailableAppsComponent,
    AvailableAppsHeaderComponent,
    CatalogsComponent,
    ChartFormComponent,
    ManageCatalogSummaryDialogComponent,
    CatalogEditFormComponent,
    CatalogAddFormComponent,
    AppCardComponent,
    AppDetailViewComponent,
    AppCardLogoComponent,
    AppRouterOutletComponent,
    AppInfoCardComponent,
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
    FormsModule,
    MatDialogModule,
    ImgFallbackModule,
    NgxSkeletonLoaderModule,
    IxIconModule,
    FlexLayoutModule,
    LazyLoadImageModule,
    TestIdModule,
  ],
})
export class AppsModule { }
