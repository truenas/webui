import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AutofocusDirective } from 'app/directives/common/autofocus/autofocus.directive';
import { HasRoleDirective } from 'app/directives/common/has-role/has-role.directive';
import { HighlightTextDirective } from 'app/directives/common/highlight-text/highlight-text.directive';
import { IfNightlyDirective } from 'app/directives/common/if-nightly/if-nightly.directive';
import { RequiresRolesWrapperComponent } from 'app/directives/common/requires-roles/requires-roles-wrapper.component';
import { RequiresRolesDirective } from 'app/directives/common/requires-roles/requires-roles.directive';
import { StepActivationDirective } from 'app/directives/common/step-activation.directive';
import { LetDirective } from './app-let.directive';

@NgModule({
  imports: [
    CommonModule,
    MatTooltipModule,
    TranslateModule,
  ],
  declarations: [
    LetDirective,
    IfNightlyDirective,
    HasRoleDirective,
    RequiresRolesWrapperComponent,
    RequiresRolesDirective,
    AutofocusDirective,
    HighlightTextDirective,
    StepActivationDirective,
  ],
  exports: [
    LetDirective,
    IfNightlyDirective,
    HasRoleDirective,
    RequiresRolesWrapperComponent,
    RequiresRolesDirective,
    AutofocusDirective,
    HighlightTextDirective,
    StepActivationDirective,
  ],
})
export class CommonDirectivesModule { }
