import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';
import { ScreenType } from 'app/enums/screen-type.enum';
import helptext from 'app/helptext/about';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Component({
  selector: 'ix-widget-help',
  templateUrl: './widget-help.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-help.component.scss',
  ],
})
export class WidgetHelpComponent extends WidgetComponent implements OnInit {
  systemType: ProductType;
  helptext = helptext;
  screenType = ScreenType.Desktop;

  readonly ProductType = ProductType;
  readonly productTypeLabels = productTypeLabels;
  readonly ScreenType = ScreenType;

  constructor(
    public mediaObserver: MediaObserver,
    private sysGenService: SystemGeneralService,
    public translate: TranslateService,
  ) {
    super(translate);

    mediaObserver.asObservable().pipe(untilDestroyed(this)).subscribe((changes) => {
      const currentScreenType = changes[0].mqAlias === 'xs' ? ScreenType.Mobile : ScreenType.Desktop;
      this.screenType = currentScreenType;
    });
  }

  ngOnInit(): void {
    this.sysGenService.getProductType$.pipe(untilDestroyed(this)).subscribe((productType) => {
      this.systemType = productType;
    });
  }
}
