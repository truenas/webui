import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MaterialModule } from 'app/app-material.module';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { EntityModule } from '../../modules/entity/entity.module';
import { ShellComponent } from './shell.component';
import { routing } from './shell.routing';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    EntityModule,
    routing,
    MaterialModule,
    TranslateModule,
    CoreComponents,
    CommonDirectivesModule,
    TerminalModule,
  ],
  declarations: [ShellComponent],
})
export class ShellModule {}
