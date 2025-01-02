import MessageFormat from '@messageformat/core';
import { MissingTranslationHandler, MissingTranslationHandlerParams } from '@ngx-translate/core';

/**
 * Messages in ICU format only get compiled when they are loaded from json file.
 * If for whatever reason message is absent from a json file, we don't want to show broken strings in the UI.
 * This will assume key is in ICU format and compile on the fly.
 */
export class IcuMissingTranslationHandler implements MissingTranslationHandler {
  private messageFormat = new MessageFormat('en');

  handle(params: MissingTranslationHandlerParams): string {
    try {
      const compiled = this.messageFormat.compile(params.key);
      if (!compiled || !params.interpolateParams) {
        return params.key;
      }
      return compiled(params.interpolateParams as Record<string, unknown> | unknown[]);
    } catch (error: unknown) {
      console.error(error);
      return params.key;
    }
  }
}
