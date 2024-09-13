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
import { CommonDirectivesModule } from 'app/directives/common-directives.module';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertsPanelComponent } from 'app/modules/alerts/components/alerts-panel/alerts-panel.component';
import { AlertEffects } from 'app/modules/alerts/store/alert.effects';
import { alertReducer } from 'app/modules/alerts/store/alert.reducer';
import { alertStateKey } from 'app/modules/alerts/store/alert.selectors';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { TestIdModule } from 'app/modules/test-id/test-id.module';

@NgModule({
  imports: [
    StoreModule.forFeature(alertStateKey, alertReducer),
    EffectsModule.forFeature([AlertEffects]),
    TranslateModule,
    MatButtonModule,
    MatMenuModule,
    IxIconModule,
    RouterModule,
    MatCheckboxModule,
    MatProgressBarModule,
    MatListModule,
    MatTooltipModule,
    CommonDirectivesModule,
    MatRippleModule,
    TestIdModule,
    FormatDateTimePipe,
    AsyncPipe,
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
