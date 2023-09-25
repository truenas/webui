import { OverlayModule } from '@angular/cdk/overlay';
import { PortalModule } from '@angular/cdk/portal';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { BulkListItemComponent } from 'app/core/components/bulk-list-item/bulk-list-item.component';
import { CopyButtonComponent } from 'app/core/components/copy-btn/copy-btn.component';
import { IxDetailsHeightDirective } from 'app/core/components/directives/details-height/details-height.directive';
import { TextLimiterTooltipComponent } from 'app/core/components/directives/text-limiter/text-limiter-tooltip/text-limiter-tooltip.component';
import { TextLimiterDirective } from 'app/core/components/directives/text-limiter/text-limiter.directive';
import { FormatDateTimePipe } from 'app/core/pipes/format-datetime.pipe';
import { MapValuePipe } from 'app/core/pipes/map-value.pipe';
import { ScheduleToCrontabPipe } from 'app/core/pipes/schedule-to-crontab.pipe';
import { YesNoPipe } from 'app/core/pipes/yes-no.pipe';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { StorageService } from 'app/services/storage.service';
import { DragHandleComponent } from './components/drag-handle/drag-handle.component';
import { CleanLinkPipe } from './pipes/clean-link.pipe';

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
  ],
  declarations: [
    TextLimiterDirective,
    IxDetailsHeightDirective,
    TextLimiterTooltipComponent,
    FormatDateTimePipe,
    CopyButtonComponent,
    MapValuePipe,
    YesNoPipe,
    BulkListItemComponent,
    CleanLinkPipe,
    ScheduleToCrontabPipe,
    DragHandleComponent,
  ],
  exports: [
    TextLimiterTooltipComponent,
    CopyButtonComponent,
    BulkListItemComponent,
    DragHandleComponent,
    CommonModule,
    OverlayModule,
    PortalModule,
    FlexLayoutModule,
    TextLimiterDirective,
    IxDetailsHeightDirective,
    FormatDateTimePipe,
    MapValuePipe,
    YesNoPipe,
    CleanLinkPipe,
    ScheduleToCrontabPipe,
  ],
  providers: [
    StorageService,
  ],
})
export class CoreComponents {}
