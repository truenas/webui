import { NgModule } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { UnauthorizedComponent } from 'app/pages/unauthorized/unauthorized/unauthorized.component';
import { routing } from 'app/pages/unauthorized/unauthorized.routing';

@NgModule({
  declarations: [
    UnauthorizedComponent,
  ],
  imports: [
    TranslateModule,
    IxIconModule,
    routing,
  ],
})
export class UnauthorizedModule {}
