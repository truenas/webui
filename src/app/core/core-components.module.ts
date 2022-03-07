import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { CopyButtonComponent } from 'app/core/components/copy-btn/copy-btn.component';
import { HtmlTooltipComponent } from 'app/core/components/directives/html-tooltip/html-tooltip.component';
import { HtmlTooltipDirective } from 'app/core/components/directives/html-tooltip/html-tooltip.directive';
import { TextLimiterTooltipComponent } from 'app/core/components/directives/text-limiter/text-limiter-tooltip/text-limiter-tooltip.component';
import { TextLimiterDirective } from 'app/core/components/directives/text-limiter/text-limiter.directive';
import { DisplayComponent } from 'app/core/components/display/display.component';
import { ViewControllerComponent } from 'app/core/components/view-controller/view-controller.component';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { MapValuePipe } from 'app/core/pipes/map-value.pipe';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { StorageService } from 'app/services/storage.service';

@NgModule({
  imports: [
    CommonModule,
    OverlayModule,
    PortalModule,
    FlexLayoutModule,
    FormsModule,
    TranslateModule,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    CommonDirectivesModule,
    EntityModule,
  ],
  declarations: [
    ViewControllerComponent,
    DisplayComponent,
    TextLimiterDirective,
    HtmlTooltipDirective,
    HtmlTooltipComponent,
    TextLimiterTooltipComponent,
    FormatDateTimePipe,
    CopyButtonComponent,
    MapValuePipe,
  ],
  exports: [
    CommonModule,
    OverlayModule,
    PortalModule,
    FlexLayoutModule,
    DisplayComponent,
    ViewControllerComponent,
    TextLimiterDirective,
    HtmlTooltipDirective,
    TextLimiterTooltipComponent,
    CopyButtonComponent,
    FormatDateTimePipe,
    MapValuePipe,
  ],
  providers: [
    StorageService,
  ],
})
export class CoreComponents {}
