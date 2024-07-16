import { mockEs102 } from 'app/core/testing/mock-enclosure/enclosure-templates/mock-expansion-shelves';
import { mockM50 } from 'app/core/testing/mock-enclosure/enclosure-templates/mock-m-series';
import { mockMini3X } from 'app/core/testing/mock-enclosure/enclosure-templates/mock-minis';
import { makeEnclosure } from 'app/core/testing/mock-enclosure/enclosure-templates/utils/make-enclosure.utils';

/**
 * Non-existent enclosures that are never going to be supported by Enclosure UI.
 * You can use those to test the behavior of the UI when it encounters an unsupported enclosure.
 */
export const fakeM50 = makeEnclosure({
  ...mockM50,
  model: `Fake${mockM50.model}`,
});

export const fakeMini = makeEnclosure({
  ...mockMini3X,
  model: `Fake${mockMini3X.model}`,
});

export const fakeEs102 = makeEnclosure({
  ...mockEs102,
  model: `Fake${mockEs102.model}`,
});
