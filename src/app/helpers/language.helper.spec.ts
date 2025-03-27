import { languages } from 'app/constants/languages.constant';
import { getLanguageFiles } from 'app/helpers/language.helper';

describe('languages', () => {
  it('compares constant with available files', async () => {
    const langFiles = await getLanguageFiles();
    expect([...languages.keys()]).toHaveLength(langFiles.length);
  });
});
