import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CopyButtonComponent } from 'app/core/components/copy-btn/copy-btn.component';
import { HtmlTooltipComponent } from 'app/core/components/directives/html-tooltip/html-tooltip.component';
import { DisplayComponent } from 'app/core/components/display/display.component';
import { FormatDateTimePipe } from 'app/core/components/pipes/format-datetime.pipe';
import { ViewControlComponent } from 'app/core/components/view-control/view-control.component';
import { ViewControllerComponent } from 'app/core/components/view-controller/view-controller.component';
import { ViewComponent } from 'app/core/components/view/view.component';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { StorageService } from 'app/services/storage.service';
import { HtmlTooltipDirective } from './directives/html-tooltip/html-tooltip.directive';
import { TextLimiterTooltipComponent } from './directives/text-limiter/text-limiter-tooltip/text-limiter-tooltip.component';
import { TextLimiterDirective } from './directives/text-limiter/text-limiter.directive';
import { ConvertPipe } from './pipes/convert.pipe';

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
    ViewComponent,
    ViewControlComponent,
    ViewControllerComponent,
    DisplayComponent,
    TextLimiterDirective,
    HtmlTooltipDirective,
    HtmlTooltipComponent,
    TextLimiterTooltipComponent,
    ConvertPipe,
    FormatDateTimePipe,
    CopyButtonComponent,
  ],
  exports: [
    CommonModule,
    MaterialModule,
    OverlayModule,
    PortalModule,
    FlexLayoutModule,
    DisplayComponent,
    ViewComponent,
    ViewControlComponent,
    ViewControllerComponent,
    TextLimiterDirective,
    HtmlTooltipDirective,
    TextLimiterTooltipComponent,
    CopyButtonComponent,
    FormatDateTimePipe,
  ],
  entryComponents: [
    ViewComponent,
    ViewControlComponent,
    ViewControllerComponent,
    TextLimiterTooltipComponent,
    CopyButtonComponent,
  ],
  providers: [
    StorageService,
  ],
})
export class CoreComponents {}
