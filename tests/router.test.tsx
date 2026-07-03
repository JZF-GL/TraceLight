import { describe, it, expect } from 'vitest';
import { router } from '../src/router';

describe('Router', () => {
  it('exports a router created by createHashRouter', () => {
    expect(router).toBeDefined();
    expect(router.routes).toBeDefined();
  });

  it('has a root layout route', () => {
    expect(router.routes.length).toBe(1);
    expect(router.routes[0].path).toBe('/');
  });

  it('has 7 named child routes plus an index route', () => {
    const rootRoute = router.routes[0];
    expect(rootRoute.children).toBeDefined();
    const namedRoutes = rootRoute.children?.filter((r) => !r.index);
    expect(namedRoutes?.length).toBe(7);
  });

  it('routes to /dashboard', () => {
    const rootRoute = router.routes[0];
    const dashboardRoute = rootRoute.children?.find((r) => r.path === 'dashboard');
    expect(dashboardRoute).toBeDefined();
  });

  it('routes to /repos', () => {
    const rootRoute = router.routes[0];
    const reposRoute = rootRoute.children?.find((r) => r.path === 'repos');
    expect(reposRoute).toBeDefined();
  });

  it('routes to /commits', () => {
    const rootRoute = router.routes[0];
    const commitsRoute = rootRoute.children?.find((r) => r.path === 'commits');
    expect(commitsRoute).toBeDefined();
  });

  it('routes to /daily', () => {
    const rootRoute = router.routes[0];
    const dailyRoute = rootRoute.children?.find((r) => r.path === 'daily');
    expect(dailyRoute).toBeDefined();
  });

  it('routes to /weekly', () => {
    const rootRoute = router.routes[0];
    const weeklyRoute = rootRoute.children?.find((r) => r.path === 'weekly');
    expect(weeklyRoute).toBeDefined();
  });

  it('routes to /stats', () => {
    const rootRoute = router.routes[0];
    const statsRoute = rootRoute.children?.find((r) => r.path === 'stats');
    expect(statsRoute).toBeDefined();
  });

  it('routes to /settings', () => {
    const rootRoute = router.routes[0];
    const settingsRoute = rootRoute.children?.find((r) => r.path === 'settings');
    expect(settingsRoute).toBeDefined();
  });

  it('has a root index route', () => {
    const rootRoute = router.routes[0];
    const indexRoute = rootRoute.children?.find((r) => r.index === true);
    expect(indexRoute).toBeDefined();
  });
});
