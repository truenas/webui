import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { AutofocusDirective } from 'app/directives/common/autofocus/autofocus.directive';
import { HasAccessDirective } from 'app/directives/common/has-access/has-access.directive';
import { MissingAccessWrapperComponent } from 'app/directives/common/has-access/missing-access-wrapper.component';
import { HasRoleDirective } from 'app/directives/common/has-role/has-role.directive';
import { IfNightlyDirective } from 'app/directives/common/if-nightly/if-nightly.directive';
import { NavigateAndInteractDirective } from 'app/directives/common/navigate-and-interact/navigate-and-interact.directive';
import { RequiresRolesDirective } from 'app/directives/common/requires-roles/requires-roles.directive';
import { StepActivationDirective } from 'app/directives/common/step-activation.directive';
import { UiSearchableElementDirective } from 'app/directives/common/ui-searchable-element.directive';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { LetDirective } from './app-let.directive';

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
    HasAccessDirective,
    MissingAccessWrapperComponent,
    RequiresRolesDirective,
    AutofocusDirective,
    NavigateAndInteractDirective,
    StepActivationDirective,
    UiSearchableElementDirective,
  ],
  exports: [
    LetDirective,
    IfNightlyDirective,
    HasRoleDirective,
    HasAccessDirective,
    MissingAccessWrapperComponent,
    RequiresRolesDirective,
    AutofocusDirective,
    NavigateAndInteractDirective,
    StepActivationDirective,
    UiSearchableElementDirective,
  ],
})
export class CommonDirectivesModule { }
