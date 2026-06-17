import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ConsoleConfig } from 'app/pages/system/advanced/console/console-card/console-card.component';
import { getConsoleFormConfig } from 'app/pages/system/advanced/console/console-form/console.form-config';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-console-form',
  template: '<ix-form-renderer [definition]="definition" [editData]="consoleConfig" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class ConsoleFormComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  slideInRef = inject<SlideInRef<ConsoleConfig, boolean>>(SlideInRef);

  protected consoleConfig = this.slideInRef.getData();

  protected definition = getConsoleFormConfig(this.api, this.translate, this.store$);
}
