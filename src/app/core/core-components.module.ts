import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { TranslateModule } from '@ngx-translate/core';
import { IxDetailsHeightDirective } from 'app/core/components/directives/details-height/details-height.directive';
import { TextLimiterTooltipComponent } from 'app/core/components/directives/text-limiter/text-limiter-tooltip/text-limiter-tooltip.component';
import { TextLimiterDirective } from 'app/core/components/directives/text-limiter/text-limiter.directive';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { DragHandleComponent } from './components/drag-handle/drag-handle.component';

/**
 * @deprecated Do not put new stuff in.
 */
@NgModule({
  imports: [
    CommonModule,
    OverlayModule,
    PortalModule,
    FlexLayoutModule,
    TranslateModule,
    IxIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    RouterModule,
    CommonDirectivesModule,
    TestIdModule,
    MatMenuModule,
  ],
  declarations: [
    TextLimiterDirective,
    IxDetailsHeightDirective,
    TextLimiterTooltipComponent,
    DragHandleComponent,
  ],
  exports: [
    TextLimiterTooltipComponent,
    DragHandleComponent,
    CommonModule,
    OverlayModule,
    PortalModule,
    FlexLayoutModule,
    TextLimiterDirective,
    IxDetailsHeightDirective,
  ],
})
export class CoreComponents {}
