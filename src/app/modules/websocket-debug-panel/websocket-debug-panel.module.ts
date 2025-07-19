import { ScrollingModule } from '@angular/cdk/scrolling';
import { NgClass } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTabsModule } from '@angular/material/tabs';
import { EffectsModule } from '@ngrx/effects';
import { StoreModule } from '@ngrx/store';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { DebugPanelToggleComponent } from './components/debug-panel-toggle/debug-panel-toggle.component';
import { MessageListComponent } from './components/message-list/message-list.component';
import { MockConfigFormComponent } from './components/mock-config/mock-config-form/mock-config-form.component';
import { MockConfigListComponent } from './components/mock-config/mock-config-list/mock-config-list.component';
import { WebSocketTabComponent } from './components/websocket-tab/websocket-tab.component';
import { WebSocketDebugEffects } from './store/websocket-debug.effects';
import { webSocketDebugReducer } from './store/websocket-debug.reducer';
import { WebSocketDebugPanelComponent } from './websocket-debug-panel.component';

@NgModule({
  declarations: [
    WebSocketDebugPanelComponent,
    DebugPanelToggleComponent,
    WebSocketTabComponent,
    MessageListComponent,
    MockConfigListComponent,
    MockConfigFormComponent,
  ],
  imports: [
    NgClass,
    ReactiveFormsModule,
    MatButtonModule,
    IxIconComponent,
    MatTabsModule,
    MatSlideToggleModule,
    ScrollingModule,
    StoreModule.forFeature('webSocketDebug', webSocketDebugReducer),
    EffectsModule.forFeature([WebSocketDebugEffects]),
  ],
  exports: [
    WebSocketDebugPanelComponent,
  ],
})
export class WebSocketDebugPanelModule { }
