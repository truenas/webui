jest.mock('dygraphs/src/extras/smooth-plotter.js', () => jest.fn());

import { adminRoutes } from './admin.routes';

describe('admin routes', () => {
  it('exposes Harbor Assistant as the only Harbor UI entry', () => {
    const childPaths = (adminRoutes[0].children ?? []).map((route) => route.path);

    expect(childPaths).toContain('harbor-assistant');
    const removedPaths = ['desk', 'bot', 'cam'].map((suffix) => `harbor${suffix}`);
    expect(childPaths).not.toEqual(expect.arrayContaining(removedPaths));
  });
});
