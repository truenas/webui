import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getStaticRouteFormConfig } from 'app/pages/system/network/components/static-route-form/static-route.form-config';

@Component({
  selector: 'ix-static-route-form',
  template: '<ix-form-renderer [definition]="definition" [editData]="editingRoute" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class StaticRouteFormComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  slideInRef = inject<SlideInRef<StaticRoute | undefined, boolean>>(SlideInRef);

  protected editingRoute = this.slideInRef.getData();

  protected definition = getStaticRouteFormConfig(this.api, this.translate, this.editingRoute);
}
