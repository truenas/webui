import { Location } from '@angular/common';
import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { UrlOptionsService } from 'app/services/url-options.service';

describe('UrlOptionsService', () => {
  let spectator: SpectatorService<UrlOptionsService>;
  const createService = createServiceFactory({
    service: UrlOptionsService,
    providers: [Location],
  });

  beforeEach(() => {
    spectator = createService();
    spectator.inject(Location).replaceState('/test/url');
  });

  describe('setUrlOptions', () => {
    it('sets url options', () => {
      const location = spectator.inject(Location);
      spectator.service.setUrlOptions('/test/url', {
        searchQuery: { isBasicQuery: true, query: 'search query' },
        pagination: { pageNumber: 2, pageSize: 10 },
        sorting: {
          active: 1,
          direction: SortDirection.Desc,
          propertyName: 'test_column',
          sortBy: jest.fn(),
        },
      });

      expect(decodeURIComponent(location.path())).toBe('/test/url/{'
        + '"searchQuery":{"isBasicQuery":true,"query":"search query"},'
        + '"pagination":{"pageNumber":2,"pageSize":10},'
        + '"sorting":{"active":1,"direction":"desc","propertyName":"test_column"}'
        + '}');
    });

    it('sets empty url options', () => {
      const location = spectator.inject(Location);
      spectator.service.setUrlOptions('/test/url', {
        searchQuery: { isBasicQuery: true, query: '' },
        pagination: { pageNumber: null, pageSize: null },
        sorting: {
          active: 1,
          direction: null,
          propertyName: 'test_column',
          sortBy: jest.fn(),
        },
      });

      expect(location.path()).toBe('/test/url');
    });
  });

  describe('buildUrlOptions', () => {
    it('returns a string with URL options encoded', () => {
      const url = spectator.service.buildUrl('/test/url', {
        searchQuery: { isBasicQuery: false, filters: [['username', '=', 'Боб']] },
        pagination: { pageNumber: 2, pageSize: 10 },
        sorting: {
          active: 1,
          direction: SortDirection.Desc,
          propertyName: 'test_column',
          sortBy: jest.fn(),
        },
      });

      expect(url).toEqual('/test/url/{'
        + '"searchQuery":{"isBasicQuery":false,"filters":[["username","=","Боб"]]},'
        + '"pagination":{"pageNumber":2,"pageSize":10},'
        + '"sorting":{"active":1,"direction":"desc","propertyName":"test_column"}'
        + '}');
    });
  });

  describe('parseUrlOptions', () => {
    it('parses url options', () => {
      const url = '{'
        + '"searchQuery":{"isBasicQuery":true,"query":"search query"},'
        + '"pagination":{"pageNumber":3,"pageSize":50},'
        + '"sorting":{"active":3,"direction":"asc","propertyName":"test_column"}'
        + '}';

      const options = spectator.service.parseUrlOptions(url);
      expect(options).toEqual({
        pagination: {
          pageNumber: 3,
          pageSize: 50,
        },
        searchQuery: {
          isBasicQuery: true,
          query: 'search query',
        },
        sorting: {
          active: 3,
          direction: SortDirection.Asc,
          propertyName: 'test_column',
        },
      });
    });

    it('parses empty url options', () => {
      const options = spectator.service.parseUrlOptions('');
      expect(options).toEqual({});
    });

    it('parses undefined url options', () => {
      const options = spectator.service.parseUrlOptions(undefined);
      expect(options).toEqual({});
    });
  });
});
