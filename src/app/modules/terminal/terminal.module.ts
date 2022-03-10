import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { CopyPasteMessageComponent } from 'app/modules/terminal/components/copy-paste-message/copy-paste-message.component';
import { TerminalComponent } from 'app/modules/terminal/components/terminal/terminal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    EntityModule,
    TranslateModule,
    CoreComponents,
    CommonDirectivesModule,
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
