import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AvailableAppsComponent } from 'app/pages/apps/components/available-apps/available-apps.component';
import { CategoryViewComponent } from 'app/pages/apps/components/available-apps/category-view/category-view.component';
import { CatalogsComponent } from 'app/pages/apps/components/catalogs/catalogs.component';
import { ChartWizardComponent } from 'app/pages/apps/components/chart-wizard/chart-wizard.component';
import { DockerImagesListComponent } from 'app/pages/apps/components/docker-images/docker-images-list/docker-images-list.component';
import { InstalledAppsComponent } from 'app/pages/apps/components/installed-apps/installed-apps.component';
import { PodLogsComponent } from 'app/pages/apps/components/installed-apps/pod-logs/pod-logs.component';
import { PodShellComponent } from 'app/pages/apps/components/installed-apps/pod-shell/pod-shell.component';
import { AppsNavigateAwayGuard } from 'app/pages/apps/guards/apps-navigate-away.guard';
import { appNameResolver } from 'app/pages/apps/resolvers/app-name.resolver';
import { AppDetailViewComponent } from './components/app-detail-view/app-detail-view.component';
import { AppRouterOutletComponent } from './components/app-router-outlet/app-router-outlet.component';

const routes: Routes = [
  {
    path: '',
    canDeactivate: [AppsNavigateAwayGuard],
    data: { breadcrumb: T('Applications') },
    children: [
      {
        path: '',
        redirectTo: 'installed',
        pathMatch: 'full',
      },
      {
        path: 'installed',
        component: AppRouterOutletComponent,
        data: { isNew: true, breadcrumb: undefined },
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: InstalledAppsComponent,
          },
          {
            path: ':catalog/:train/:appId',
            component: AppRouterOutletComponent,
            data: { breadcrumb: T('Installed') },
            children: [
              {
                path: '',
                pathMatch: 'full',
                component: InstalledAppsComponent,
              },
              {
                path: 'edit',
                component: ChartWizardComponent,
              },
              {
                path: 'shell/:podName/:command',
                component: PodShellComponent,
                data: { title: T('Pod Shell') },
              },
              {
                path: 'logs/:podName/:command/:tail_lines',
                component: PodLogsComponent,
                data: { title: T('Pod Logs') },
              },
            ],
          },
          {
            path: 'manage-container-images',
            component: DockerImagesListComponent,
            data: { title: T('Manage Container Images') },
          },
        ],
      },
      {
        path: 'available',
        component: AppRouterOutletComponent,
        data: { isNew: true, breadcrumb: T('Discover') },
        children: [
          {
            path: 'catalogs',
            pathMatch: 'full',
            component: CatalogsComponent,
            data: { title: T('Catalogs') },
          },
          {
            path: '',
            component: AvailableAppsComponent,
          },
          {
            path: ':category',
            component: CategoryViewComponent,
          },
          {
            path: ':catalog/:train/:appId',
            component: AppRouterOutletComponent,
            resolve: { breadcrumb: appNameResolver },
            children: [
              {
                path: '',
                pathMatch: 'full',
                component: AppDetailViewComponent,
              },
              {
                path: 'install',
                component: ChartWizardComponent,
              },
            ],
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AppsRoutingModule {}
