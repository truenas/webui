import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TooltipDocReplacePipe } from 'app/modules/tooltip/tooltip-docreplace.pipe';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@NgModule({
  imports: [
    CommonModule,
    NgxPopperjsModule,
    TranslateModule,
    CommonDirectivesModule,
    CastModule,
    IxIconModule,
  ],
  declarations: [
    TooltipComponent,
    TooltipDocReplacePipe,
  ],
  exports: [
    TooltipComponent,
    TooltipDocReplacePipe,
  ],
})
export class TooltipModule {}
