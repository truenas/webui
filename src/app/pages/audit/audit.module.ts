import { AsyncPipe, NgTemplateOutlet } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { IxDetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { ExportButtonComponent } from 'app/modules/buttons/export-button/export-button.component';
import { SearchInputModule } from 'app/modules/forms/search-input/search-input.module';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AuditComponent } from 'app/pages/audit/components/audit/audit.component';
import { routing } from './audit.routing';
import { EventDataDetailsCardComponent } from './components/event-data-details-card/event-data-details-card.component';
import { LogDetailsPanelComponent } from './components/log-details-panel/log-details-panel.component';
import { MetadataDetailsCardComponent } from './components/metadata-details-card/metadata-details-card.component';

@NgModule({
  imports: [
    MatButtonModule,
    TranslateModule,
    MatCardModule,
    IxIconComponent,
    ReactiveFormsModule,
    MatSelectModule,
    SearchInputModule,
    MatTooltipModule,
    routing,
    ExportButtonComponent,
    CopyButtonComponent,
    PageHeaderModule,
    NgTemplateOutlet,
    AsyncPipe,
    IxDetailsHeightDirective,
    UiSearchDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableBodyComponent,
    IxTableCellDirective,
    IxTablePagerComponent,
    IxTableHeadComponent,
    FakeProgressBarComponent,
    TestDirective,
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
