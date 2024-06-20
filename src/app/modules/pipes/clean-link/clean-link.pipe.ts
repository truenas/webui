import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'cleanLink',
  standalone: true,
})
export class CleanLinkPipe implements PipeTransform {
  transform(value: string): string {
    let cleanSrc = value
      .replace('http://', '')
      .replace('https://', '')
      .replace('www.', '');
    while (cleanSrc.endsWith('/')) {
      cleanSrc = cleanSrc.substring(0, cleanSrc.length - 1);
    }
    return cleanSrc;
  }
}
