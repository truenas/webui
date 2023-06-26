import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AvailableAppsComponent } from 'app/pages/apps/components/available-apps/available-apps.component';
import { CategoryViewComponent } from 'app/pages/apps/components/available-apps/category-view/category-view.component';
import { CatalogsComponent } from 'app/pages/apps/components/catalogs/catalogs.component';
import { ChartWizardComponent } from 'app/pages/apps/components/chart-wizard/chart-wizard.component';
import { InstalledAppsComponent } from 'app/pages/apps/components/installed-apps/installed-apps.component';
import { PodLogsComponent } from 'app/pages/apps/components/installed-apps/pod-logs/pod-logs.component';
import { PodShellComponent } from 'app/pages/apps/components/installed-apps/pod-shell/pod-shell.component';
import { AppDetailViewComponent } from './components/app-detail-view/app-detail-view.component';
import { AppRouterOutletComponent } from './components/app-router-outlet/app-router-outlet.component';

const routes: Routes = [
  {
    path: '',
    data: { title: T('Applications') },
    children: [{
      path: '',
      redirectTo: 'installed',
      pathMatch: 'full',
    },
    {
      path: 'installed',
      component: InstalledAppsComponent,
      data: { isNew: true },
      children: [{
        path: ':appId',
        component: InstalledAppsComponent,
      },
      {
        path: ':appId/shell/:pname/:cname',
        component: PodShellComponent,
        data: { title: T('Pod Shell'), breadcrumb: T('Pod Shell') },
      },
      {
        path: ':appId/logs/:pname/:cname/:tail_lines',
        component: PodLogsComponent,
        data: { title: T('Pod Logs'), breadcrumb: T('Pod Logs') },
      }],
    },
    {
      path: 'available',
      component: AppRouterOutletComponent,
      data: { isNew: true },
      children: [{
        path: '',
        component: AvailableAppsComponent,
        data: { title: T('Discover'), breadcrumb: T('Applications') },
      },
      {
        path: ':category',
        component: CategoryViewComponent,
        data: { title: T('Category'), breadcrumb: T('Applications') },
      },
      {
        path: ':catalog/:train/:appId',
        component: AppDetailViewComponent,
        data: { title: T('Discover'), breadcrumb: T('Applications') },
      },
      {
        path: ':catalog/:train/:appId/install',
        component: ChartWizardComponent,
        data: { title: T('Discover'), breadcrumb: T('Applications') },
      },
      {
        path: ':catalog/:train/:appId/edit',
        component: ChartWizardComponent,
        data: { title: 'Edit App', breadcrumb: T('Applications') },
      }],
    },
    {
      path: 'catalogs',
      component: CatalogsComponent,
      data: { title: T('Catalogs'), breadcrumb: T('Catalogs') },
    }],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppsRoutingModule { }
