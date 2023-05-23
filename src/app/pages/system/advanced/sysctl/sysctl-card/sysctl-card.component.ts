import { ChangeDetectionStrategy, Component } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { helptextSystemAdvanced } from 'app/helptext/system/advanced';
import { Tunable } from 'app/interfaces/tunable.interface';
import { AppTableConfig } from 'app/modules/entity/table/table.component';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { TunableFormComponent } from 'app/pages/system/advanced/sysctl/tunable-form/tunable-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-sysctl-card',
  styleUrls: ['../../common-card.scss'],
  templateUrl: './sysctl-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SysctlCardComponent {
  readonly tableConfig: AppTableConfig = {
    title: helptextSystemAdvanced.fieldset_sysctl,
    titleHref: '/system/sysctl',
    queryCall: 'tunable.query',
    deleteCall: 'tunable.delete',
    deleteMsg: {
      title: helptextSystemAdvanced.fieldset_sysctl,
      key_props: ['var'],
    },
    emptyEntityLarge: false,
    columns: [
      { name: this.translate.instant('Var'), prop: 'var' },
      { name: this.translate.instant('Value'), prop: 'value' },
      { name: this.translate.instant('Enabled'), prop: 'enabled' },
      { name: this.translate.instant('Description'), prop: 'comment' },
    ],
    add: async () => {
      await this.advancedSettings.showFirstTimeWarningIfNeeded();
      const slideIn = this.slideInService.open(TunableFormComponent);
      slideIn.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
        this.tableConfig.tableComponent?.getData();
      });
    },
    edit: async (tunable: Tunable) => {
      await this.advancedSettings.showFirstTimeWarningIfNeeded();
      const slideIn = this.slideInService.open(TunableFormComponent);
      slideIn.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
        this.tableConfig.tableComponent?.getData();
      });
      slideIn.componentInstance.setTunableForEdit(tunable);
    },
  };

  constructor(
    private slideInService: IxSlideInService,
    private translate: TranslateService,
    private advancedSettings: AdvancedSettingsService,
  ) {}
}
