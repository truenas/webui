import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getKernelFormConfig, KernelFormValues } from 'app/pages/system/advanced/kernel/kernel-form/kernel.form-config';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-kernel-form',
  template: '<ix-form-renderer [definition]="definition" [editData]="editData" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class KernelFormComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  slideInRef = inject<SlideInRef<boolean, boolean>>(SlideInRef);

  protected editData: KernelFormValues = { debugkernel: !!this.slideInRef.getData() };

  protected definition = getKernelFormConfig(this.api, this.translate, this.store$);
}
