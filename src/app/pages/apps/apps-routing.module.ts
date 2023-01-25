import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AvailableAppsComponent } from 'app/pages/apps/components/available-apps/available-apps.component';
import { CatalogsComponent } from 'app/pages/apps/components/catalogs/catalogs.component';
import { InstalledAppsComponent } from 'app/pages/apps/components/installed-apps/installed-apps.component';
import { AppDetailViewComponent } from './components/app-detail-view/app-detail-view.component';

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
      component: AppDetailViewComponent,
      data: { title: T('App Detail'), breadcrumb: T('App Detail') },
    }],
  },
  {
    path: 'available',
    component: AvailableAppsComponent,
    data: { title: T('Available'), breadcrumb: T('Available') },
    children: [{
      path: ':appId',
      component: AppDetailViewComponent,
      data: { title: T('App Detail'), breadcrumb: T('App Detail') },
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
