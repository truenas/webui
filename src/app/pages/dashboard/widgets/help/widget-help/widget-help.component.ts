import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { filter, map } from 'rxjs';
import { productTypeLabels } from 'app/enums/product-type.enum';
import { helptextAbout } from 'app/helptext/about';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { SystemGeneralService } from 'app/services/system-general.service';

@Component({
  selector: 'ix-widget-help',
  templateUrl: './widget-help.component.html',
  styleUrl: './widget-help.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetHelpComponent {
  size = input.required<SlotSize>();

  protected readonly helptext = helptextAbout;

  productType$ = this.sysGenService.getProductType$.pipe(
    filter(() => !this.sysGenService.isEnterprise),
    map((productType) => productTypeLabels.get(productType)),
  );

  constructor(
    private sysGenService: SystemGeneralService,
  ) {}
}
