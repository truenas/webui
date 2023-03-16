import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CastModule } from 'app/modules/cast/cast.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@NgModule({
  imports: [
    CommonModule,
    NgxPopperjsModule,
    TranslateModule,
    CommonDirectivesModule,
    CastModule,
    IxIconModule,
    TestIdModule,
  ],
  declarations: [
    TooltipComponent,
  ],
  exports: [
    TooltipComponent,
  ],
})
export class TooltipModule {}
