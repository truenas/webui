import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { SearchInputModule } from 'app/modules/search-input/search-input.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AuditComponent } from 'app/pages/audit/components/audit/audit.component';
import { routing } from './audit.routing';
import { LogDetailsPanelComponent } from './components/log-details-panel/log-details-panel.component';

@NgModule({
  imports: [
    CommonModule,
    LayoutModule,
    MatButtonModule,
    TestIdModule,
    TranslateModule,
    IxFormsModule,
    MatCardModule,
    IxIconModule,
    ReactiveFormsModule,
    MatSelectModule,
    IxTable2Module,
    AppLoaderModule,
    SearchInputModule,
    CoreComponents,
    routing,
    CoreComponents,
  ],
  exports: [],
  declarations: [
    AuditComponent,
    LogDetailsPanelComponent,
  ],
  providers: [],
})
export class AuditModule {
}
