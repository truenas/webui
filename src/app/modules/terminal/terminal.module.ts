import { NgStyle } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { ToolbarSliderComponent } from 'app/modules/forms/toolbar-slider/toolbar-slider.component';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { CopyPasteMessageComponent } from 'app/modules/terminal/components/copy-paste-message/copy-paste-message.component';
import { TerminalComponent } from 'app/modules/terminal/components/terminal/terminal.component';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';

@NgModule({
  imports: [
    TranslateModule,
    MatButtonModule,
    TestIdModule,
    MatDialogModule,
    ToolbarSliderComponent,
    TooltipComponent,
    PageHeaderModule,
    NgStyle,
  ],
  declarations: [
    TerminalComponent,
    CopyPasteMessageComponent,
  ],
  exports: [
    TerminalComponent,
  ],
})
export class TerminalModule {}
