import { SplitLinkPipe } from 'app/modules/pipes/split-link/split-link.pipe';

describe('SplitLinkPipe', () => {
  const pipe = new SplitLinkPipe();

  it('splits a sentence into the text around its link and the link text', () => {
    expect(pipe.transform('Change Session Timeout in <link>Preferences</link>.')).toEqual({
      before: 'Change Session Timeout in ',
      link: 'Preferences',
      after: '.',
    });
  });

  it('keeps a link that a translation moved to the start of the sentence', () => {
    expect(pipe.transform('<link>Préférences</link> : modifier le délai')).toEqual({
      before: '',
      link: 'Préférences',
      after: ' : modifier le délai',
    });
  });

  it('renders the whole text as the link when the tags are missing', () => {
    expect(pipe.transform('Change Session Timeout in Preferences')).toEqual({
      before: '',
      link: 'Change Session Timeout in Preferences',
      after: '',
    });
  });
});
