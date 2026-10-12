import { SplitTagPipe } from 'app/modules/pipes/split-tag/split-tag.pipe';

describe('SplitTagPipe', () => {
  const pipe = new SplitTagPipe();

  it('splits a sentence into the text around its link and the link text', () => {
    expect(pipe.transform('Change Session Timeout in <link>Preferences</link>.')).toEqual({
      before: 'Change Session Timeout in ',
      inner: 'Preferences',
      after: '.',
    });
  });

  it('keeps a span that a translation moved to the start of the sentence', () => {
    expect(pipe.transform('<link>Préférences</link> : modifier le délai')).toEqual({
      before: '',
      inner: 'Préférences',
      after: ' : modifier le délai',
    });
  });

  it('splits around the tag it is given', () => {
    expect(pipe.transform('Affects <b>3</b> existing snapshots.', 'b')).toEqual({
      before: 'Affects ',
      inner: '3',
      after: ' existing snapshots.',
    });
  });

  it('renders the whole text as the span when the tags are missing', () => {
    expect(pipe.transform('Change Session Timeout in Preferences')).toEqual({
      before: '',
      inner: 'Change Session Timeout in Preferences',
      after: '',
    });
  });
});
