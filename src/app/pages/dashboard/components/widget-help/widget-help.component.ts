import { Component, OnInit } from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';
import { ScreenTypeOption } from 'app/enums/screen-type.enum';
import helptext from 'app/helptext/about';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { SystemGeneralService } from 'app/services';

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
  screenType = ScreenTypeOption.Desktop;

  readonly ProductType = ProductType;
  readonly productTypeLabels = productTypeLabels;
  readonly ScreenTypeOption = ScreenTypeOption;

  constructor(
    public mediaObserver: MediaObserver,
    private sysGenService: SystemGeneralService,
    public translate: TranslateService,
  ) {
    super(translate);

    mediaObserver.media$.pipe(untilDestroyed(this)).subscribe((evt) => {
      const currentScreenType = evt.mqAlias === 'xs' ? ScreenTypeOption.Mobile : ScreenTypeOption.Desktop;
      this.screenType = currentScreenType;
    });
  }

  ngOnInit(): void {
    this.sysGenService.getProductType$.pipe(untilDestroyed(this)).subscribe((productType) => {
      this.systemType = productType;
    });
  }
}
