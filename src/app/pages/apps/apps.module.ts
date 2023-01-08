import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
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
  ],
  imports: [
    CommonModule,
    AppsRoutingModule,
    PageHeaderModule,
    MatButtonModule,
    TranslateModule,
    IxFormsModule,
    ReactiveFormsModule,
    EntityModule,
    MatCardModule,
    CoreComponents,
    MatSelectModule,
    FormsModule,
    MatDialogModule,
  ],
})
export class AppsModule { }
