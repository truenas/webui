import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { EntityModule } from 'app/modules/entity/entity.module';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { ShellComponent } from './shell.component';
import { routing } from './shell.routing';

@NgModule({
  imports: [
    CommonModule,
    EntityModule,
    routing,
    TranslateModule,
    CoreComponents,
    CommonDirectivesModule,
    TerminalModule,
  ],
  declarations: [ShellComponent],
})
export class ShellModule {}
