import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';
import { SystemGeneralService } from 'app/services/system-general.service';

@Component({
  selector: 'ix-copyright-line',
  templateUrl: './copyright-line.component.html',
  styleUrls: ['./copyright-line.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CopyrightLineComponent {
  @Input() withIxLogo = false;

  productType$ = this.systemGeneral.getProductType$;
  copyrightYear$ = this.systemGeneral.getCopyrightYear$;

  readonly ProductType = ProductType;
  readonly productTypeLabels = productTypeLabels;

  constructor(
    private systemGeneral: SystemGeneralService,
  ) { }
}
