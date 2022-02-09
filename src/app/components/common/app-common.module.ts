import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule, SvgIconRegistryService } from 'angular-svg-icon';
import { ChartistModule } from 'ng-chartist';
import { MaterialModule } from 'app/app-material.module';
import { PageTitleComponent } from 'app/components/common/page-title/page-title.component';
import { SecondaryMenuComponent } from 'app/components/common/secondary-menu/secondary-menu.component';
import { CoreComponents } from 'app/core/components/core-components.module';
import { ViewControllerComponent } from 'app/core/components/view-controller/view-controller.component';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AlertsModule } from 'app/modules/alerts/alerts.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { JobsModule } from 'app/modules/jobs/jobs.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { DialogService } from 'app/services/dialog.service';
import { LanguageService } from 'app/services/language.service';
import { LocaleService } from 'app/services/locale.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { AdminLayoutComponent } from './layouts/admin-layout/admin-layout.component';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { ModalComponent } from './modal/modal.component';
import { NavigationComponent } from './navigation/navigation.component';
import { TopbarComponent } from './topbar/topbar.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    FlexLayoutModule,
    MaterialModule,
    CommonDirectivesModule,
    TranslateModule,
    IxFormsModule,
    ChartistModule,
    HttpClientModule,
    EntityModule,
    CoreComponents,
    ScrollingModule,
    AngularSvgIconModule.forRoot(),
    CastModule,
    AlertsModule,
    JobsModule,
    LayoutModule,
  ],
  declarations: [
    AdminLayoutComponent,
    AuthLayoutComponent,
    TopbarComponent,
    NavigationComponent,
    ModalComponent,
    BreadcrumbComponent,
    PageTitleComponent,
    SecondaryMenuComponent,
  ],
  providers: [ThemeService, DialogService, LanguageService, LocaleService, SvgIconRegistryService],
  exports: [PageTitleComponent, ViewControllerComponent],
})
export class AppCommonModule {}
