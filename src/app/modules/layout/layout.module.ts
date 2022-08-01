import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { BreadcrumbComponent } from 'app/modules/layout/components/breadcrumb/breadcrumb.component';
import {
  ChangePasswordDialogComponent,
} from 'app/modules/layout/components/change-password-dialog/change-password-dialog.component';
import { NavigationComponent } from 'app/modules/layout/components/navigation/navigation.component';
import { PageTitleHeaderComponent } from 'app/modules/layout/components/page-title-header/page-title-header.component';
import { SecondaryMenuComponent } from 'app/modules/layout/components/secondary-menu/secondary-menu.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    IxFormsModule,
    IxIconModule,
    ReactiveFormsModule,
    MatButtonModule,
    FlexModule,
    RouterModule,
    CommonDirectivesModule,
    MatTooltipModule,
    MatDividerModule,
    MatListModule,
    MatDialogModule,
  ],
  declarations: [
    ChangePasswordDialogComponent,
    PageTitleHeaderComponent,
    BreadcrumbComponent,
    NavigationComponent,
    SecondaryMenuComponent,
  ],
  exports: [
    ChangePasswordDialogComponent,
    PageTitleHeaderComponent,
    SecondaryMenuComponent,
    NavigationComponent,
  ],
})
export class LayoutModule {}
