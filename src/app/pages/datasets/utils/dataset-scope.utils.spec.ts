import { isInDatasetScope } from 'app/pages/datasets/utils/dataset-scope.utils';

describe('isInDatasetScope', () => {
  it('matches the scoped dataset itself, with or without children', () => {
    expect(isInDatasetScope('tank/a', 'tank/a', true)).toBe(true);
    expect(isInDatasetScope('tank/a', 'tank/a', false)).toBe(true);
  });

  it('matches a child only when children are included', () => {
    expect(isInDatasetScope('tank/a/child', 'tank/a', true)).toBe(true);
    expect(isInDatasetScope('tank/a/child', 'tank/a', false)).toBe(false);
  });

  it('never matches a sibling whose name merely starts with the scope', () => {
    expect(isInDatasetScope('tank/ab', 'tank/a', true)).toBe(false);
    expect(isInDatasetScope('tank/ab', 'tank/a', false)).toBe(false);
  });

  it('never matches a missing dataset', () => {
    expect(isInDatasetScope(undefined, 'tank/a', true)).toBe(false);
  });
});
