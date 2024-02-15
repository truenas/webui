import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { ProductType } from 'app/enums/product-type.enum';
import { TrainService } from 'app/pages/system/update/services/train.service';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { SystemGeneralService } from 'app/services/system-general.service';

@UntilDestroy()
@Component({
  selector: 'ix-train-info-card',
  styleUrls: ['train-info-card.component.scss'],
  templateUrl: './train-info-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrainInfoCardComponent implements OnInit {
  productType: ProductType;

  protected readonly ProductType = ProductType;

  constructor(
    private sysGenService: SystemGeneralService,
    protected trainService: TrainService,
    protected updateService: UpdateService,
  ) {
  }

  ngOnInit(): void {
    this.productType = this.sysGenService.getProductType();
  }
}
