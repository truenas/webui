import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Ng2FittextModule } from 'ng2-fittext';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { AutofocusDirective } from 'app/directives/common/autofocus/autofocus.directive';
import { DisableFocusableElementsDirective } from 'app/directives/common/disable-focusable-elements/disable-focusable-elements.directive';
import { HasAccessDirective } from 'app/directives/common/has-access/has-access.directive';
import { MissingAccessWrapperComponent } from 'app/directives/common/has-access/missing-access-wrapper.component';
import { HasRoleDirective } from 'app/directives/common/has-role/has-role.directive';
import { IfNightlyDirective } from 'app/directives/common/if-nightly/if-nightly.directive';
import { NavigateAndInteractDirective } from 'app/directives/common/navigate-and-interact/navigate-and-interact.directive';
import { NewFeatureIndicatorWrapperComponent } from 'app/directives/common/new-feature-indicator/new-feature-indicator-wrapper.component';
import { NewFeatureIndicatorDirective } from 'app/directives/common/new-feature-indicator/new-feature-indicator.directive';
import { NewFeatureIndicatorService } from 'app/directives/common/new-feature-indicator/new-feature-indicator.service';
import { RequiresRolesDirective } from 'app/directives/common/requires-roles/requires-roles.directive';
import { StepActivationDirective } from 'app/directives/common/step-activation.directive';
import { UiSearchDirective } from 'app/directives/common/ui-search.directive';
import { CastModule } from 'app/modules/cast/cast.module';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { LetDirective } from './app-let.directive';

@NgModule({
  imports: [
    CommonModule,
    MatTooltipModule,
    TranslateModule,
    IxIconModule,
    MatButtonModule,
    NgxPopperjsModule,
    CastModule,
    Ng2FittextModule,
  ],
  declarations: [
    LetDirective,
    IfNightlyDirective,
    HasRoleDirective,
    HasAccessDirective,
    DisableFocusableElementsDirective,
    MissingAccessWrapperComponent,
    RequiresRolesDirective,
    AutofocusDirective,
    NavigateAndInteractDirective,
    StepActivationDirective,
    NewFeatureIndicatorWrapperComponent,
    NewFeatureIndicatorDirective,
    UiSearchDirective,
  ],
  exports: [
    LetDirective,
    IfNightlyDirective,
    HasRoleDirective,
    HasAccessDirective,
    DisableFocusableElementsDirective,
    MissingAccessWrapperComponent,
    RequiresRolesDirective,
    AutofocusDirective,
    NavigateAndInteractDirective,
    StepActivationDirective,
    NewFeatureIndicatorWrapperComponent,
    NewFeatureIndicatorDirective,
    UiSearchDirective,
    Ng2FittextModule,
  ],
  providers: [
    NewFeatureIndicatorService,
  ],
})
export class CommonDirectivesModule { }
