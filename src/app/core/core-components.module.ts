import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { ContextMenuComponent } from 'app/core/components/context-menu/context-menu.component';
import { CopyButtonComponent } from 'app/core/components/copy-btn/copy-btn.component';
import { HtmlTooltipDirective } from 'app/core/components/directives/html-tooltip/html-tooltip.directive';
import { TextLimiterTooltipComponent } from 'app/core/components/directives/text-limiter/text-limiter-tooltip/text-limiter-tooltip.component';
import { TextLimiterDirective } from 'app/core/components/directives/text-limiter/text-limiter.directive';
import { DisplayComponent } from 'app/core/components/display/display.component';
import { ViewButtonComponent } from 'app/core/components/view-button/view-button.component';
import { ViewChartAreaComponent } from 'app/core/components/view-chart-area/view-chart-area.component';
import { ViewChartBarComponent } from 'app/core/components/view-chart-bar/view-chart-bar.component';
import { ViewChartDonutComponent } from 'app/core/components/view-chart-donut/view-chart-donut.component';
import { ViewChartGaugeComponent } from 'app/core/components/view-chart-gauge/view-chart-gauge.component';
import { ViewChartLineComponent } from 'app/core/components/view-chart-line/view-chart-line.component';
import { ViewChartPieComponent } from 'app/core/components/view-chart-pie/view-chart-pie.component';
import { ViewChartComponent } from 'app/core/components/view-chart/view-chart.component';
import { ViewControlComponent } from 'app/core/components/view-control/view-control.component';
import { ViewControllerComponent } from 'app/core/components/view-controller/view-controller.component';
import { ViewComponent } from 'app/core/components/view/view.component';
import { ConvertPipe } from 'app/core/pipes/convert.pipe';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { MapValuePipe } from 'app/core/pipes/map-value.pipe';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/pages/common/entity/entity.module';
import { StorageService } from 'app/services/storage.service';
/*
 *
 * This is the Core Module. By importing this module you'll
 * ensure your page will have the right dependencies in place
 * to make use of Core Components
 *
 * */

@NgModule({
  imports: [
    CommonModule,
    MaterialModule,
    OverlayModule,
    PortalModule,
    FlexLayoutModule,
    FormsModule,
    TranslateModule,
    RouterModule,
    CommonDirectivesModule,
    EntityModule,
  ],
  declarations: [
    ContextMenuComponent,
    ViewComponent,
    ViewControlComponent,
    ViewControllerComponent,
    DisplayComponent,
    ViewButtonComponent,
    ViewChartComponent,
    ViewChartAreaComponent,
    ViewChartDonutComponent,
    ViewChartPieComponent,
    ViewChartGaugeComponent,
    ViewChartBarComponent,
    ViewChartLineComponent,
    TextLimiterDirective,
    HtmlTooltipDirective,
    TextLimiterTooltipComponent,
    ConvertPipe,
    MapValuePipe,
    FormatDateTimePipe,
    CopyButtonComponent,
  ],
  exports: [ // Modules and Components here
    CommonModule,
    MaterialModule,
    OverlayModule,
    PortalModule,
    FlexLayoutModule,
    DisplayComponent,
    ContextMenuComponent,
    ViewComponent,
    ViewChartComponent,
    ViewChartAreaComponent,
    ViewChartDonutComponent,
    ViewChartGaugeComponent,
    ViewChartBarComponent,
    ViewChartPieComponent,
    ViewChartLineComponent,
    ViewControlComponent,
    ViewButtonComponent,
    ViewControllerComponent,
    TextLimiterDirective,
    HtmlTooltipDirective,
    TextLimiterTooltipComponent,
    CopyButtonComponent,
    FormatDateTimePipe,
    MapValuePipe,
  ],
  entryComponents: [
    ContextMenuComponent,
    ViewComponent,
    ViewChartComponent,
    ViewChartAreaComponent,
    ViewChartDonutComponent,
    ViewChartGaugeComponent,
    ViewChartBarComponent,
    ViewChartPieComponent,
    ViewChartLineComponent,
    ViewControlComponent,
    ViewButtonComponent,
    ViewControllerComponent,
    TextLimiterTooltipComponent,
    CopyButtonComponent,
  ],
  providers: [
    StorageService,
  ],
})
export class CoreComponents {}
