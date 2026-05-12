jest.mock('dygraphs/src/extras/smooth-plotter.js', () => jest.fn());

import { adminRoutes } from './admin.routes';

describe('admin routes', () => {
  it('keeps direct Harbor Assistant routing available', () => {
    const harborAssistantRoute = (adminRoutes[0].children ?? [])
      .find((route) => route.path === 'harbor-assistant');

    expect(harborAssistantRoute?.loadChildren).toBeDefined();
  });

  it('does not restore legacy split Harbor UI routes', () => {
    const childPaths = (adminRoutes[0].children ?? []).map((route) => route.path);
    const removedPaths = ['desk', 'bot', 'cam'].map((suffix) => `harbor${suffix}`);

    expect(childPaths).not.toEqual(expect.arrayContaining(removedPaths));
  });
});
