import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { MaterialModule } from 'app/app-material.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { TooltipDocReplacePipe } from 'app/modules/tooltip/tooltip-docreplace';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@NgModule({
  imports: [
    CommonModule,
    NgxPopperjsModule,
    TranslateModule,
    CommonDirectivesModule,
    MaterialModule,
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
