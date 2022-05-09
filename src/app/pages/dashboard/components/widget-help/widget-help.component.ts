import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ProductType } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/about';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { SystemGeneralService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  selector: 'ix-widget-help',
  templateUrl: './widget-help.component.html',
  styleUrls: ['./widget-help.component.scss'],
})
export class WidgetHelpComponent extends WidgetComponent implements OnInit {
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  systemType: ProductType;
  helptext = helptext;
  readonly ProductType = ProductType;
  screenType = 'Desktop'; // Desktop || Mobile

  constructor(
    private localeService: LocaleService,
    public mediaObserver: MediaObserver,
    private sysGenService: SystemGeneralService,
    public translate: TranslateService,
  ) {
    super(translate);
    mediaObserver.media$.pipe(untilDestroyed(this)).subscribe((evt) => {
      const st = evt.mqAlias === 'xs' ? 'Mobile' : 'Desktop';
      this.screenType = st;
    });
  }

  ngOnInit(): void {
    this.sysGenService.getProductType$.pipe(untilDestroyed(this)).subscribe((productType) => {
      this.systemType = productType as ProductType;
    });
  }
}
