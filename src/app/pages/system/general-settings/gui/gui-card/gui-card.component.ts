import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { combineLatest, take } from 'rxjs';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { GuiFormComponent } from 'app/pages/system/general-settings/gui/gui-form/gui-form.component';
import { DataCard } from 'app/pages/system/interfaces/data-card.interface';
import { IxSlideInService, ResponseOnClose } from 'app/services/ix-slide-in.service';
import { AppState } from 'app/store';
import { guiFormClosedWithoutSaving } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

const gui = 'gui';

@UntilDestroy()
@Component({
  selector: 'ix-gui-card',
  templateUrl: './gui-card.component.html',
  styleUrls: ['./gui-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuiCardComponent implements OnInit {
  card: DataCard<typeof gui>;
  cardTitle = helptext.guiTitle;

  constructor(
    private translate: TranslateService,
    private store$: Store<AppState>,
    private slideInService: IxSlideInService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getData();
  }

  getData(): void {
    combineLatest([
      this.store$.pipe(waitForGeneralConfig),
      this.store$.pipe(waitForPreferences),
    ]).pipe(untilDestroyed(this)).subscribe(([config, preferences]) => {
      this.card = {
        title: this.cardTitle,
        id: gui,
        items: [
          { label: this.translate.instant('Theme'), value: preferences.userTheme },
          { label: helptext.ui_certificate.label, value: config.ui_certificate.name },
          { label: helptext.ui_address.label, value: config.ui_address.join(', ') },
          { label: helptext.ui_v6address.label, value: config.ui_v6address.join(', ') },
          { label: helptext.ui_port.label, value: config.ui_port },
          { label: helptext.ui_httpsport.label, value: config.ui_httpsport },
          { label: helptext.ui_httpsprotocols.label, value: config.ui_httpsprotocols.join(', ') },
          {
            label: helptext.ui_httpsredirect.label,
            value: config.ui_httpsredirect ? helptext.enabled : helptext.disabled,
          },
          {
            label: helptext.crash_reporting.label,
            value: config.crash_reporting ? helptext.enabled : helptext.disabled,
          },
          {
            label: helptext.usage_collection.label,
            value: config.usage_collection ? helptext.enabled : helptext.disabled,
          },
          {
            label: helptext.ui_consolemsg.label,
            value: config.ui_consolemsg ? helptext.enabled : helptext.disabled,
          },
        ],
      };
      this.cdr.markForCheck();
    });
  }

  doAdd(): void {
    this.slideInService.open(GuiFormComponent);
    this.slideInService.onClose$.pipe(take(1), untilDestroyed(this)).subscribe(({ response }: ResponseOnClose) => {
      // TODO: Do not simplify. Refactor slideInService to be more like MatDialog.
      if (response === true) {
        return;
      }

      this.store$.dispatch(guiFormClosedWithoutSaving());
    });
  }
}
