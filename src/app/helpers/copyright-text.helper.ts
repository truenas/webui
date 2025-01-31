import { environment } from 'environments/environment';
import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';

export function getCopyrightText(productType?: ProductType): string {
  if (productType) {
    return `TrueNAS ${productTypeLabels.get(productType)} ® © ${environment.buildYear}`;
  }
  return `TrueNAS ® © ${environment.buildYear}`;
}
