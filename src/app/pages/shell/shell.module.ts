import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { TerminalModule } from 'app/modules/terminal/terminal.module';
import { ShellComponent } from './shell.component';
import { routing } from './shell.routing';

@NgModule({
  imports: [
    routing,
    TranslateModule,
    TerminalModule,
    UiSearchDirective,
  ],
  declarations: [ShellComponent],
})
export class ShellModule {}
