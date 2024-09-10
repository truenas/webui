import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { ExportButtonComponent } from 'app/modules/buttons/export-button/export-button.component';
import { SearchInputModule } from 'app/modules/forms/search-input/search-input.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { AuditComponent } from 'app/pages/audit/components/audit/audit.component';
import { routing } from './audit.routing';
import { EventDataDetailsCardComponent } from './components/event-data-details-card/event-data-details-card.component';
import { LogDetailsPanelComponent } from './components/log-details-panel/log-details-panel.component';
import { MetadataDetailsCardComponent } from './components/metadata-details-card/metadata-details-card.component';

@NgModule({
  imports: [
    CommonModule,
    MatButtonModule,
    TestIdModule,
    TranslateModule,
    MatCardModule,
    IxIconModule,
    ReactiveFormsModule,
    MatSelectModule,
    IxTableModule,
    AppLoaderModule,
    SearchInputModule,
    MatTooltipModule,
    CommonDirectivesModule,
    routing,
    ExportButtonComponent,
    CopyButtonComponent,
    PageHeaderModule,
  ],
  exports: [],
  declarations: [
    AuditComponent,
    LogDetailsPanelComponent,
    MetadataDetailsCardComponent,
    EventDataDetailsCardComponent,
  ],
  providers: [],
})
export class AuditModule {
}
