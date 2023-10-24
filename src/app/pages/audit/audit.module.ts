import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AuditComponent } from 'app/pages/audit/components/audit/audit.component';
import { routing } from './audit.routing';
import { LogRowDetailsComponent } from './components/log-row-details/log-row-details.component';
import { ManageViewsComponent } from './components/manage-views/manage-views.component';
import { SetupColumnsComponent } from './components/setup-columns/setup-columns.component';

@NgModule({
  imports: [
    CommonModule,
    LayoutModule,
    MatButtonModule,
    TestIdModule,
    TranslateModule,
    IxFormsModule,
    routing,
    ReactiveFormsModule,
    MatSelectModule,
    IxTable2Module,
  ],
  exports: [],
  declarations: [
    AuditComponent,
    SetupColumnsComponent,
    ManageViewsComponent,
    LogRowDetailsComponent,
  ],
  providers: [],
})
export class AuditModule {
}
