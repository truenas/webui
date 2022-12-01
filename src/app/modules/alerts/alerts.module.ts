import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatRippleModule } from '@angular/material/core';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertsPanelComponent } from 'app/modules/alerts/components/alerts-panel/alerts-panel.component';
import { AlertEffects } from 'app/modules/alerts/store/alert.effects';
import { alertReducer } from 'app/modules/alerts/store/alert.reducer';
import { alertStateKey } from 'app/modules/alerts/store/alert.selectors';
import { IxIconModule } from 'app/modules/ix-icon/ix-icon.module';

@NgModule({
  imports: [
    CommonModule,
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
    CoreComponents,
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
