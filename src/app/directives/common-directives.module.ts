import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { Ng2FittextModule } from 'ng2-fittext';
import { NgxPopperjsModule } from 'ngx-popperjs';
import { AutofocusDirective } from 'app/directives/autofocus/autofocus.directive';
import { IxDetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { DisableFocusableElementsDirective } from 'app/directives/disable-focusable-elements/disable-focusable-elements.directive';
import { HasAccessDirective } from 'app/directives/has-access/has-access.directive';
import { MissingAccessWrapperComponent } from 'app/directives/has-access/missing-access-wrapper.component';
import { HasRoleDirective } from 'app/directives/has-role/has-role.directive';
import { IfNightlyDirective } from 'app/directives/if-nightly/if-nightly.directive';
import { NavigateAndInteractDirective } from 'app/directives/navigate-and-interact/navigate-and-interact.directive';
import { NewFeatureIndicatorWrapperComponent } from 'app/directives/new-feature-indicator/new-feature-indicator-wrapper.component';
import { NewFeatureIndicatorDirective } from 'app/directives/new-feature-indicator/new-feature-indicator.directive';
import { NewFeatureIndicatorService } from 'app/directives/new-feature-indicator/new-feature-indicator.service';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { StepActivationDirective } from 'app/directives/step-activation.directive';
import {
  TextLimiterTooltipComponent,
} from 'app/directives/text-limiter/text-limiter-tooltip/text-limiter-tooltip.component';
import { TextLimiterDirective } from 'app/directives/text-limiter/text-limiter.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { CastPipe } from 'app/modules/pipes/cast/cast.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';
import { LetDirective } from './app-let.directive';

const components = [
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
];

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
    ...components,
  ],
  exports: [
    ...components,
    Ng2FittextModule,
  ],
  providers: [
    NewFeatureIndicatorService,
  ],
})
export class CommonDirectivesModule { }
