import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter, map } from 'rxjs';
import { productTypeLabels } from 'app/enums/product-type.enum';
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
export class WidgetHelpComponent extends WidgetComponent {
  helptext = helptextAbout;
  productType$ = this.sysGenService.getProductType$.pipe(
    filter(() => !this.sysGenService.isEnterprise),
    map((productType) => productTypeLabels.get(productType)),
  );

  constructor(
    private sysGenService: SystemGeneralService,
    public translate: TranslateService,
  ) {
    super(translate);
  }
}
