import { Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { CoreService } from 'app/core/services/core-service/core.service';
import { ProductType } from 'app/enums/product-type.enum';
import helptext from 'app/helptext/about';
import { SystemGeneralService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  selector: 'widget-help',
  templateUrl: './widget-help.component.html',
  styleUrls: ['./widget-help.component.scss'],
})
export default class WidgetHelpComponent implements OnInit {
  copyrightYear = this.localeService.getCopyrightYearFromBuildTime();
  extraMsg: boolean;
  systemType: ProductType;
  helptext = helptext;
  readonly ProductType = ProductType;

  constructor(
    private core: CoreService,
    private localeService: LocaleService,
    private sysGenService: SystemGeneralService,
  ) { }

  ngOnInit(): void {
    this.sysGenService.getProductType$.pipe(untilDestroyed(this)).subscribe((productType) => {
      this.systemType = productType as ProductType;
    });
  }

  turnOffWelcomeDialog(): void {

  }
}
