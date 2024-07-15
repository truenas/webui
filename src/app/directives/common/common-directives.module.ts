import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Ng2FittextModule } from 'ng2-fittext';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { AutofocusDirective } from 'app/directives/common/autofocus/autofocus.directive';
import { IxDetailsHeightDirective } from 'app/directives/common/details-height/details-height.directive';
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
import {
  TextLimiterTooltipComponent,
} from 'app/directives/common/text-limiter/text-limiter-tooltip/text-limiter-tooltip.component';
import { TextLimiterDirective } from 'app/directives/common/text-limiter/text-limiter.directive';
import { UiSearchDirective } from 'app/directives/common/ui-search.directive';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { LetDirective } from './app-let.directive';

@NgModule({
  imports: [
    CommonModule,
    MatTooltipModule,
    TranslateModule,
    IxIconModule,
    MatButtonModule,
    NgxPopperjsModule,
    Ng2FittextModule,
    CastPipe,
    TestIdModule,
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
    IxDetailsHeightDirective,
    TextLimiterDirective,
    TextLimiterTooltipComponent,
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
    IxDetailsHeightDirective,
    TextLimiterDirective,
  ],
  providers: [
    NewFeatureIndicatorService,
  ],
})
export class CommonDirectivesModule { }
