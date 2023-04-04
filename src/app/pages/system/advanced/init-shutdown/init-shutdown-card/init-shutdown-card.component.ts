import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { AppTableConfig } from 'app/modules/entity/table/table.component';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  InitShutdownFormComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-init-shutdown-card',
  templateUrl: './init-shutdown-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InitShutdownCardComponent implements OnInit {
  readonly tableConfig: AppTableConfig = {
    title: helptextSystemAdvanced.fieldset_initshutdown,
    titleHref: '/system/initshutdown',
    queryCall: 'initshutdownscript.query',
    deleteCall: 'initshutdownscript.delete',
    deleteMsg: {
      title: this.translate.instant('Init/Shutdown Script'),
      key_props: ['type', 'command', 'script'],
    },
    emptyEntityLarge: false,
    columns: [
      { name: this.translate.instant('Type'), prop: 'type' },
      { name: this.translate.instant('Command'), prop: 'command' },
      { name: this.translate.instant('Script'), prop: 'script' },
      { name: this.translate.instant('Description'), prop: 'comment' },
      { name: this.translate.instant('When'), prop: 'when' },
      { name: this.translate.instant('Enabled'), prop: 'enabled' },
      { name: this.translate.instant('Timeout'), prop: 'timeout' },
    ],
    add: async () => {
      await this.advancedSettings.showFirstTimeWarningIfNeeded();

      this.slideIn.open(InitShutdownFormComponent);
    },
    edit: async (script: InitShutdownScript) => {
      await this.advancedSettings.showFirstTimeWarningIfNeeded();

      const slideInServiceRef = this.slideIn.open(InitShutdownFormComponent);
      slideInServiceRef.componentInstance.setScriptForEdit(script);
    },
  };

  constructor(
    private slideIn: IxSlideInService,
    private translate: TranslateService,
    private advancedSettings: AdvancedSettingsService,
  ) {}

  ngOnInit(): void {
    this.slideIn.onClose$.pipe(untilDestroyed(this)).subscribe(() => {
      this.tableConfig.tableComponent?.getData();
    });
  }
}
