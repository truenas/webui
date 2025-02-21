import { environment } from 'environments/environment';
import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';

export function getCopyrightHtml(productType?: ProductType): string {
  if (productType) {
    return `TrueNAS® ${productTypeLabels.get(productType)} <br /> © ${environment.buildYear}`;
  }
  return `TrueNAS® <br /> © ${environment.buildYear}`;
}
