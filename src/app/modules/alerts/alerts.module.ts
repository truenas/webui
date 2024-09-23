import { AsyncPipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRippleModule } from '@angular/material/core';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { LetDirective } from 'app/directives/app-let.directive';
import { NavigateAndInteractDirective } from 'app/directives/navigate-and-interact/navigate-and-interact.directive';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertsPanelComponent } from 'app/modules/alerts/components/alerts-panel/alerts-panel.component';
import { AlertEffects } from 'app/modules/alerts/store/alert.effects';
import { alertReducer } from 'app/modules/alerts/store/alert.reducer';
import { alertStateKey } from 'app/modules/alerts/store/alert.selectors';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';

@NgModule({
  imports: [
    StoreModule.forFeature(alertStateKey, alertReducer),
    EffectsModule.forFeature([AlertEffects]),
    TranslateModule,
    MatButtonModule,
    MatMenuModule,
    IxIconComponent,
    RouterModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatListModule,
    MatTooltipModule,
    MatRippleModule,
    FormatDateTimePipe,
    AsyncPipe,
    NavigateAndInteractDirective,
    LetDirective,
    TestDirective,
  ],
  declarations: [
    AlertsPanelComponent,
    AlertComponent,
  ],
  exports: [
    AlertsPanelComponent,
  ],
})
export class AlertsModule {}
