import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { TranslateService } from '@ngx-translate/core';
import helptext from 'app/helptext/about';
import { WidgetComponent } from 'app/core/components/widgets/widget/widget.component';
import { SystemGeneralService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';

@Component({
  selector: 'widget-help',
  templateUrl: './widget-help.component.html',
  styleUrls: ['./widget-help.component.scss'],
})
export class WidgetHelpComponent extends WidgetComponent {
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  systemType = window.localStorage.getItem('product_type');
  helptext = helptext;
  screenType = 'Desktop'; // Desktop || Mobile

  constructor(
    private localeService: LocaleService,
    public mediaObserver: MediaObserver,
    public translate: TranslateService,
  ) {
    super(translate);
    mediaObserver.media$.subscribe((evt) => {
      const st = evt.mqAlias === 'xs' ? 'Mobile' : 'Desktop';
      this.screenType = st;
    });
  }
}
