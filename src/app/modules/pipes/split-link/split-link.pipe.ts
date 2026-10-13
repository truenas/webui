import { Pipe, PipeTransform } from '@angular/core';

export interface SplitLink {
  before: string;
  link: string;
  after: string;
}

/**
 * Splits a translated sentence around its `<link>…</link>` span, so translators get one whole
 * sentence (and can move the link) while the template still renders the link text as a control:
 * `'Change Session Timeout in <link>Preferences</link>' | translate | splitLink`.
 * A translation that lost the tags renders entirely as the link, so it stays clickable.
 */
@Pipe({
  name: 'splitLink',
})
export class SplitLinkPipe implements PipeTransform {
  transform(text: string): SplitLink {
    const match = /^([\s\S]*?)<link>([\s\S]*?)<\/link>([\s\S]*)$/.exec(text);
    if (!match) {
      return { before: '', link: text, after: '' };
    }
    return { before: match[1], link: match[2], after: match[3] };
  }
}
