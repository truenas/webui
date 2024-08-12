import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { AppWizardComponent } from 'app/pages/apps/components/app-wizard/app-wizard.component';
import { AppsScopeWrapperComponent } from 'app/pages/apps/components/apps-scope-wrapper.component';
import { AvailableAppsComponent } from 'app/pages/apps/components/available-apps/available-apps.component';
import { CategoryViewComponent } from 'app/pages/apps/components/available-apps/category-view/category-view.component';
import { DockerImagesListComponent } from 'app/pages/apps/components/docker-images/docker-images-list/docker-images-list.component';
import { ContainerShellComponent } from 'app/pages/apps/components/installed-apps/container-shell/container-shell.component';
import { InstalledAppsComponent } from 'app/pages/apps/components/installed-apps/installed-apps.component';
import { PodLogsComponent } from 'app/pages/apps/components/installed-apps/pod-logs/pod-logs.component';
import { appNameResolver } from 'app/pages/apps/resolvers/app-name.resolver';
import { AppDetailViewComponent } from './components/app-detail-view/app-detail-view.component';
import { AppRouterOutletComponent } from './components/app-router-outlet/app-router-outlet.component';

const routes: Routes = [
  {
    path: '',
    component: AppsScopeWrapperComponent,
    data: { breadcrumb: T('Applications') },
    children: [
      {
        path: '',
        redirectTo: 'installed',
        pathMatch: 'full',
      },
      {
        path: 'installed/manage-container-images',
        redirectTo: 'manage-container-images',
        pathMatch: 'full',
      },
      {
        path: 'installed',
        component: AppRouterOutletComponent,
        data: { breadcrumb: undefined },
        children: [
          {
            path: '',
            pathMatch: 'full',
            component: InstalledAppsComponent,
          },
          {
            path: ':train/:appId',
            component: AppRouterOutletComponent,
            data: { breadcrumb: null },
            children: [
              {
                path: '',
                pathMatch: 'full',
                component: InstalledAppsComponent,
              },
              {
                path: 'edit',
                component: AppWizardComponent,
                data: { breadcrumb: null },
              },
              {
                path: 'shell/:containerId/:command',
                component: ContainerShellComponent,
                data: { title: T('Pod Shell') },
              },
              {
                path: 'logs/:containerId',
                component: PodLogsComponent,
                data: { title: T('Pod Logs') },
              },
            ],
          },
        ],
      },
      {
        path: 'manage-container-images',
        component: DockerImagesListComponent,
        data: { title: T('Manage Container Images') },
      },
      {
        path: 'available',
        component: AppRouterOutletComponent,
        data: { breadcrumb: T('Discover') },
        children: [
          {
            path: '',
            component: AvailableAppsComponent,
          },
          {
            path: ':category',
            component: CategoryViewComponent,
          },
          {
            path: ':train/:appId',
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
                component: AppWizardComponent,
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
