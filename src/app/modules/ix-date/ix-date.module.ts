import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { IxDateComponent } from 'app/modules/ix-date/ix-date.component';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';
import { LocaleService } from 'app/services/locale.service';

@NgModule({
  imports: [
    CommonModule,
    MatTooltipModule,
    CoreComponents,
    TooltipModule,
    TranslateModule,
  ],
  declarations: [
    IxDateComponent,
  ],
  exports: [
    IxDateComponent,
  ],
  providers: [
    LocaleService,
  ],
})
export class IxDateModule { }
