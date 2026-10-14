import { Pipe, PipeTransform } from '@angular/core';

export interface SplitTag {
  before: string;
  inner: string;
  after: string;
}

/**
 * Splits a translated sentence around its `<tag>…</tag>` span (`<link>` unless told otherwise), so
 * translators get one whole sentence (and can move the span) while the template still renders the
 * span as its own element — a link, a button, a bold number:
 * `'Change Session Timeout in <link>Preferences</link>' | translate | splitTag`.
 * A translation that lost the tags renders entirely as the span, so a link stays clickable.
 */
@Pipe({
  name: 'splitTag',
})
export class SplitTagPipe implements PipeTransform {
  transform(text: string, tag = 'link'): SplitTag {
    const match = new RegExp(`^([\\s\\S]*?)<${tag}>([\\s\\S]*?)</${tag}>([\\s\\S]*)$`).exec(text);
    if (!match) {
      return { before: '', inner: text, after: '' };
    }
    return { before: match[1], inner: match[2], after: match[3] };
  }
}
