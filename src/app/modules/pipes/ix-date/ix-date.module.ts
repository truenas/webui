import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { IxDateComponent } from 'app/modules/pipes/ix-date/ix-date.component';
import { LocaleService } from 'app/services/locale.service';

@NgModule({
  imports: [
    CommonModule,
    MatTooltipModule,
    CoreComponents,
    TranslateModule,
    FormatDateTimePipe,
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
