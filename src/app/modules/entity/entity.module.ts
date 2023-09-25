import { A11yModule } from '@angular/cdk/a11y';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { CdkTableModule } from '@angular/cdk/table';
import { TextFieldModule } from '@angular/cdk/text-field';
import { CdkTreeModule } from '@angular/cdk/tree';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSortModule } from '@angular/material/sort';
import { MatStepperModule } from '@angular/material/stepper';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TreeModule } from '@bugsplat/angular-tree-component';
import { TranslateModule } from '@ngx-translate/core';
import { NgxFilesizeModule } from 'ngx-filesize';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { EntityEmptyComponent } from 'app/modules/entity/entity-empty/entity-empty.component';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { EntityRowDetailsComponent } from 'app/modules/entity/entity-table/entity-row-details/entity-row-details.component';
import { EntityTableActionsComponent } from 'app/modules/entity/entity-table/entity-table-actions/entity-table-actions.component';
import { EntityTableAddActionsComponent } from 'app/modules/entity/entity-table/entity-table-add-actions/entity-table-add-actions.component';
import { EntityTableRowDetailsComponent } from 'app/modules/entity/entity-table/entity-table-row-details/entity-table-row-details.component';
import { EntityTableComponent } from 'app/modules/entity/entity-table/entity-table.component';
import { ToolbarMultimenuComponent } from 'app/modules/entity/entity-toolbar/components/toolbar-multimenu/toolbar-multimenu.component';
import { ToolbarSliderComponent } from 'app/modules/entity/entity-toolbar/components/toolbar-slider/toolbar-slider.component';
import { ExpandableTableComponent } from 'app/modules/entity/table/expandable-table/expandable-table.component';
import { TableComponent } from 'app/modules/entity/table/table.component';
import { TableService } from 'app/modules/entity/table/table.service';
import { TaskScheduleListComponent } from 'app/modules/entity/task-schedule-list/task-schedule-list.component';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SchedulerModule } from 'app/modules/scheduler/scheduler.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    RouterModule,
    CdkTableModule,
    TreeModule,
    MatListModule,
    MatDividerModule,
    IxIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatToolbarModule,
    MatExpansionModule,
    MatStepperModule,
    MatMenuModule,
    MatSortModule,
    MatSliderModule,
    MatSlideToggleModule,
    MatSelectModule,
    MatButtonModule,
    MatPaginatorModule,
    MatDialogModule,
    MatProgressBarModule,
    MatCheckboxModule,
    MatButtonToggleModule,
    PageHeaderModule,
    MatRadioModule,
    TextFieldModule,
    MatAutocompleteModule,
    MatTabsModule,
    MatChipsModule,
    MatDatepickerModule,
    FlexLayoutModule,
    TranslateModule,
    CdkTreeModule,
    OverlayModule,
    A11yModule,
    NgxFilesizeModule,
    CommonDirectivesModule,
    TooltipModule,
    CastModule,
    MatNativeDateModule,
    SchedulerModule,
    TestIdModule,
    LayoutModule,
  ],
  declarations: [
    TaskScheduleListComponent,
    EntityTableComponent,
    EntityTableRowDetailsComponent,
    EntityRowDetailsComponent,
    EntityTableActionsComponent,
    EntityTableAddActionsComponent,
    EntityJobComponent,
    ToolbarMultimenuComponent,
    ToolbarSliderComponent,
    TableComponent,
    ExpandableTableComponent,
    EntityEmptyComponent,
  ],
  exports: [
    EntityTableComponent,
    EntityRowDetailsComponent,
    EntityTableAddActionsComponent,
    EntityTableActionsComponent,
    ToolbarSliderComponent,
    ToolbarMultimenuComponent,
    TableComponent,
    ExpandableTableComponent,
    CdkTreeModule,
    EntityEmptyComponent,
  ],
  providers: [
    AppLoaderService,
    TableService,
  ],
})
export class EntityModule { }
