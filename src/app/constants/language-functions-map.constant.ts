import { json } from '@codemirror/lang-json';
import { yaml } from '@codemirror/lang-yaml';
import { Extension } from '@codemirror/state';
import { CodeEditorLanguage } from 'app/enums/code-editor-language.enum';

export const languageFunctionsMap: Record<CodeEditorLanguage, () => Extension> = {
  [CodeEditorLanguage.Json]: json,
  [CodeEditorLanguage.Yaml]: yaml,
  [CodeEditorLanguage.Text]: () => [],
  [CodeEditorLanguage.Toml]: () => [],
};
