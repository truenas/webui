import { Injectable } from '@angular/core';

interface MiniSeries {
  pathImg: string;
  images: string[];
}

@Injectable({ providedIn: 'root' })
export class ProductImageService {
  private miniSeries: Record<string, MiniSeries> = {
    mini: {
      pathImg: 'freenas_mini_cropped.png',
      images: [
        'FREENAS-MINI-2.0',
        'FREENAS-MINI-3.0-E',
        'FREENAS-MINI-3.0-E+',
        'TRUENAS-MINI-3.0-E',
        'TRUENAS-MINI-3.0-E+',
      ],
    },
    miniX: {
      pathImg: 'freenas_mini_x_cropped.png',
      images: [
        'FREENAS-MINI-3.0-X',
        'FREENAS-MINI-3.0-X+',
        'TRUENAS-MINI-3.0-X',
        'TRUENAS-MINI-3.0-X+',
      ],
    },
    miniXL: {
      pathImg: 'freenas_mini_xl_cropped.png',
      images: [
        'FREENAS-MINI-XL',
        'FREENAS-MINI-3.0-XL+',
        'TRUENAS-MINI-3.0-XL+',
      ],
    },
  };
  private serverSeries = ['M30', 'M40', 'M50', 'M60', 'X10', 'X20', 'Z20', 'Z30', 'Z35', 'Z50', 'R10', 'R20', 'R40', 'R50'];

  getMiniImagePath(sysProd: string): string {
    for (const series in this.miniSeries) {
      const product = this.miniSeries[series].images.find((image) => image === sysProd);
      if (product) {
        return this.miniSeries[series].pathImg;
      }
    }
    return null;
  }

  getServerProduct(sysProd: string): string {
    for (const series of this.serverSeries) {
      if (sysProd.includes(series)) {
        return series;
      }
    }
    return null;
  }
}
