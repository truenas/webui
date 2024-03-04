import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';
import { ScreenType } from 'app/enums/screen-type.enum';
import { helptextAbout } from 'app/helptext/about';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetHelpComponent extends WidgetComponent implements OnInit {
  productType: ProductType;
  helptext = helptextAbout;
  screenType = ScreenType.Desktop;

  readonly ProductType = ProductType;
  readonly productTypeLabels = productTypeLabels;
  readonly ScreenType = ScreenType;

  constructor(
    private sysGenService: SystemGeneralService,
    public translate: TranslateService,
    private cdr: ChangeDetectorRef,
    private breakpointObserver: BreakpointObserver,
  ) {
    super(translate);
  }

  ngOnInit(): void {
    this.sysGenService.getProductType$
      .pipe(untilDestroyed(this))
      .subscribe((productType) => {
        this.productType = productType;
        this.cdr.markForCheck();
      });

    this.breakpointObserver
      .observe([Breakpoints.XSmall])
      .pipe(untilDestroyed(this))
      .subscribe((state) => {
        this.screenType = state.matches ? ScreenType.Mobile : ScreenType.Desktop;
        this.cdr.markForCheck();
      });
  }
}
