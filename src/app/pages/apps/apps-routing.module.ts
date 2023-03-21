import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AvailableAppsComponent } from 'app/pages/apps/components/available-apps/available-apps.component';
import { CatalogsComponent } from 'app/pages/apps/components/catalogs/catalogs.component';
import { ChartWizardComponent } from 'app/pages/apps/components/chart-wizard/chart-wizard.component';
import { InstalledAppsComponent } from 'app/pages/apps/components/installed-apps/installed-apps.component';
import { AppDetailViewComponent } from './components/app-detail-view/app-detail-view.component';
import { AppRouterOutletComponent } from './components/app-router-outlet/app-router-outlet.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'installed',
    pathMatch: 'full',
  },
  {
    path: 'installed',
    component: InstalledAppsComponent,
    data: { title: T('Installed'), breadcrumb: T('Applications') },
    children: [{
      path: ':appId',
      component: InstalledAppsComponent,
      data: { title: T('Installed Apps'), breadcrumb: T('Installed') },
    }],
  },
  {
    path: 'available',
    component: AppRouterOutletComponent,
    data: { title: T('Available'), breadcrumb: T('Applications') },
    children: [{
      path: '',
      component: AvailableAppsComponent,
      data: { title: T('Available'), breadcrumb: T('Applications') },
    },
    {
      path: ':appId',
      children: [{
        path: '',
        component: AppDetailViewComponent,
        data: { title: T('App Detail'), breadcrumb: T('App Detail') },
      },
      {
        path: 'install',
        component: ChartWizardComponent,
        data: { title: T('Install App'), breadcrumb: T('Install App') },
      },
      {
        path: 'edit',
        component: ChartWizardComponent,
        data: { title: T('Edit App'), breadcrumb: T('Edit App') },
      }],
    }],
  },
  {
    path: 'catalogs',
    component: CatalogsComponent,
    data: { title: T('Catalogs'), breadcrumb: T('Catalogs') },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppsRoutingModule { }
