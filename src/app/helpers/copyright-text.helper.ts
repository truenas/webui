import { ProductType, productTypeLabels } from 'app/enums/product-type.enum';

export function getCopyrightText(
  productType: ProductType,
  buildYear: number,
): string {
  return `TrueNAS ${productTypeLabels.get(productType)} ® © ${buildYear}`;
}
