import {
  cloudSyncTaskEmptyConfig, noSearchResultsConfig, replicationTaskEmptyConfig,
} from 'app/constants/empty-configs';
import { emptyConfigIcon, splitIconMarker } from 'app/helpers/empty-config.helper';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';

describe('splitIconMarker', () => {
  it('splits each library prefix back into a bare name and its library', () => {
    expect(splitIconMarker('mdi-cloud-outline')).toEqual({ name: 'cloud-outline', library: 'mdi' });
    expect(splitIconMarker('app-replication')).toEqual({ name: 'replication', library: 'custom' });
    expect(splitIconMarker('mat-security')).toEqual({ name: 'security', library: 'material' });
  });

  it('reports an unprefixed name as mdi, matching tn-empty defaults', () => {
    expect(splitIconMarker('rocket')).toEqual({ name: 'rocket', library: 'mdi' });
  });

  it('reports a missing marker as no icon', () => {
    expect(splitIconMarker(undefined)).toEqual({ name: undefined, library: 'mdi' });
  });
});

describe('emptyConfigIcon', () => {
  it('derives the tn-empty icon bindings from the catalog config', () => {
    expect(emptyConfigIcon(cloudSyncTaskEmptyConfig)).toEqual({
      name: 'cloud-outline',
      library: 'mdi',
      size: '56px',
    });

    expect(emptyConfigIcon(replicationTaskEmptyConfig)).toEqual({
      name: 'replication',
      library: 'custom',
      size: '56px',
    });
  });

  it('leaves the size unset for a config that is not large', () => {
    expect(emptyConfigIcon({ title: 'Nothing here', icon: 'mdi-rocket' } as EmptyConfig).size).toBeUndefined();
  });

  it('takes the icon from the override for a config that carries none', () => {
    expect(emptyConfigIcon(noSearchResultsConfig, 'mdi-magnify-scan')).toEqual({
      name: 'magnify-scan',
      library: 'mdi',
      size: '56px',
    });
  });
});
