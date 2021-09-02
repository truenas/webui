import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CoreComponents } from 'app/core/components/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { CopyPasteMessageComponent } from 'app/pages/common/terminal/copy-paste-message.component';
import { EntityModule } from '../entity/entity.module';
import { TerminalComponent } from './terminal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    EntityModule,
    MaterialModule,
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
