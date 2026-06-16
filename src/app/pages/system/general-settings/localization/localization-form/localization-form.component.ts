import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { LocalizationSettings } from 'app/interfaces/localization-settings.interface';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  getLocalizationFormConfig, LocalizationFormValues,
} from 'app/pages/system/general-settings/localization/localization-form/localization.form-config';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-localization-form',
  template: '<ix-form-renderer [definition]="definition" [editData]="editData" />',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IxFormRendererComponent],
})
export class LocalizationFormComponent {
  private sysGeneralService = inject(SystemGeneralService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  slideInRef = inject<SlideInRef<LocalizationSettings, boolean>>(SlideInRef);

  private editingSettings = this.slideInRef.getData();

  // Map the entity (`kbdMap`) onto the form-control shape (`kbdmap`); the keys
  // differ, so this single source must do the renaming rather than relying on
  // `editData` patching keys that don't line up with the controls.
  protected editData: LocalizationFormValues = {
    kbdmap: this.editingSettings?.kbdMap ?? '',
    timezone: this.editingSettings?.timezone ?? '',
  };

  protected definition = getLocalizationFormConfig(
    this.sysGeneralService,
    this.api,
    this.translate,
    this.store$,
  );
}
