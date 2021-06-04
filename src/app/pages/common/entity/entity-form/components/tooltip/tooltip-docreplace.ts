import { Pipe, PipeTransform } from '@angular/core';
import { DocsService } from 'app/services/docs.service';

@Pipe({
  name: 'docreplace',
})
export class TooltipDocReplacePipe implements PipeTransform {
  constructor(public docsService: DocsService) {}
  transform(message: string): string {
    return this.docsService.docReplace(message);
  }
}
