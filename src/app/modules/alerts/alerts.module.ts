import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { CoreComponents } from 'app/core/components/core-components.module';
import { CommonDirectivesModule } from 'app/directives/common/common-directives.module';
import { AlertComponent } from 'app/modules/alerts/components/alert/alert.component';
import { AlertsPanelComponent } from 'app/modules/alerts/components/alerts-panel/alerts-panel.component';
import { AlertEffects } from 'app/modules/alerts/store/alert.effects';
import { alertReducer } from 'app/modules/alerts/store/alert.reducer';
import { alertStateKey } from 'app/modules/alerts/store/alert.selectors';

@NgModule({
  imports: [
    CommonModule,
    StoreModule.forFeature(alertStateKey, alertReducer),
    EffectsModule.forFeature([AlertEffects]),
    TranslateModule,
    MatButtonModule,
    MatMenuModule,
    MatIconModule,
    RouterModule,
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
