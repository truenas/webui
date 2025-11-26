import { environment } from 'environments/environment';
import { ProductType } from 'app/enums/product-type.enum';

export function getCopyrightHtml(productType?: ProductType): string {
  if (productType) {
    return `HarborOS® <br /> © ${environment.buildYear}`;
  }
  return `HarborOS® <br /> © ${environment.buildYear}`;
}
