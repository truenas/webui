import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { dump } from 'js-yaml';

export function jsonToYaml(jsonData: unknown): string {
  try {
    return dump(jsonData, {
      skipInvalid: true,
    });
  } catch (error) {
    console.error(error);
    return T('Error occurred');
  }
}
