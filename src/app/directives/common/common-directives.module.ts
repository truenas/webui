import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AutofocusDirective } from 'app/directives/common/autofocus/autofocus.directive';
import { HasRoleDirective } from 'app/directives/common/has-role/has-role.directive';
import { IfNightlyDirective } from 'app/directives/common/if-nightly/if-nightly.directive';
import { NavigateAndInteractDirective } from 'app/directives/common/navigate-and-interact/navigate-and-interact.directive';
import { RequiresRolesWrapperComponent } from 'app/directives/common/requires-roles/requires-roles-wrapper.component';
import { RequiresRolesDirective } from 'app/directives/common/requires-roles/requires-roles.directive';
import { StepActivationDirective } from 'app/directives/common/step-activation.directive';
import { LetDirective } from './app-let.directive';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';

@NgModule({
  imports: [
    CommonModule,
    MatTooltipModule,
    TranslateModule,
    IxIconModule,
  ],
  declarations: [
    LetDirective,
    IfNightlyDirective,
    HasRoleDirective,
    RequiresRolesWrapperComponent,
    RequiresRolesDirective,
    AutofocusDirective,
    NavigateAndInteractDirective,
    StepActivationDirective,
  ],
  exports: [
    LetDirective,
    IfNightlyDirective,
    HasRoleDirective,
    RequiresRolesWrapperComponent,
    RequiresRolesDirective,
    AutofocusDirective,
    NavigateAndInteractDirective,
    StepActivationDirective,
  ],
})
export class CommonDirectivesModule { }
