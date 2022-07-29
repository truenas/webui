import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { LayoutModule } from 'app/modules/layout/layout.module';
import { CopyPasteMessageComponent } from 'app/modules/terminal/components/copy-paste-message/copy-paste-message.component';
import { TerminalComponent } from 'app/modules/terminal/components/terminal/terminal.component';
import { TooltipModule } from 'app/modules/tooltip/tooltip.module';

@NgModule({
  imports: [
    CommonModule,
    EntityModule,
    TranslateModule,
    CoreComponents,
    CommonDirectivesModule,
    MatButtonModule,
    TooltipModule,
    LayoutModule,
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
