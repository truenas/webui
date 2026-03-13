import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { datasetNameSortComparer, doesDatasetOrChildrenHaveShares, doesDatasetHaveShares } from 'app/pages/datasets/utils/dataset.utils';

describe('datasetNameSortComparer', () => {
  it('sorts dataset paths in natural order maintaining parent-child relations', () => {
    const filepaths = [
      { name: '/parent' },
      { name: '/parent30' },
      { name: '/parent-2' },
      { name: '/parent3' },
      { name: '/pårent/child' },
      { name: '/parent/child' },
      { name: '/parent/child/grandchild' },
      { name: '/parent4' },
      { name: '/pårent' },
    ] as DatasetDetails[];

    const sortedFilepaths = filepaths.toSorted(datasetNameSortComparer);

    expect(sortedFilepaths).toEqual([
      { name: '/parent' },
      { name: '/parent/child' },
      { name: '/parent/child/grandchild' },
      { name: '/pårent' },
      { name: '/pårent/child' },
      { name: '/parent-2' },
      { name: '/parent3' },
      { name: '/parent4' },
      { name: '/parent30' },
    ]);
  });
});

describe('doesDatasetOrChildrenHaveShares', () => {
  it('returns true when dataset has SMB shares', () => {
    const dataset = { name: 'pool/dataset', smb_shares: [{}] } as DatasetDetails;
    expect(doesDatasetOrChildrenHaveShares(dataset)).toBe(true);
  });

  it('returns true when dataset has NFS shares', () => {
    const dataset = { name: 'pool/dataset', nfs_shares: [{}] } as DatasetDetails;
    expect(doesDatasetOrChildrenHaveShares(dataset)).toBe(true);
  });

  it('returns true when dataset has iSCSI shares', () => {
    const dataset = { name: 'pool/dataset', iscsi_shares: [{}] } as DatasetDetails;
    expect(doesDatasetOrChildrenHaveShares(dataset)).toBe(true);
  });

  it('returns true when dataset has NVMe-oF shares', () => {
    const dataset = { name: 'pool/dataset', nvmet_shares: [{}] } as DatasetDetails;
    expect(doesDatasetOrChildrenHaveShares(dataset)).toBe(true);
  });

  it('returns true when child dataset has shares', () => {
    const dataset = {
      name: 'pool/dataset',
      children: [
        { name: 'pool/dataset/child', smb_shares: [{}] } as DatasetDetails,
      ],
    } as DatasetDetails;
    expect(doesDatasetOrChildrenHaveShares(dataset)).toBe(true);
  });

  it('returns false when dataset and children have no shares', () => {
    const dataset = {
      name: 'pool/dataset',
      children: [
        { name: 'pool/dataset/child' } as DatasetDetails,
      ],
    } as DatasetDetails;
    expect(doesDatasetOrChildrenHaveShares(dataset)).toBe(false);
  });
});

describe('doesDatasetHaveShares', () => {
  it('returns true when child has shares', () => {
    const dataset = {
      name: 'pool/dataset',
      children: [
        { name: 'pool/dataset/child', nfs_shares: [{}] } as DatasetDetails,
      ],
    } as DatasetDetails;
    expect(doesDatasetHaveShares(dataset)).toBe(true);
  });

  it('returns true when grandchild has NVMe-oF shares', () => {
    const dataset = {
      name: 'pool/dataset',
      children: [
        {
          name: 'pool/dataset/child',
          children: [
            { name: 'pool/dataset/child/grandchild', nvmet_shares: [{}] } as DatasetDetails,
          ],
        } as DatasetDetails,
      ],
    } as DatasetDetails;
    expect(doesDatasetHaveShares(dataset)).toBe(true);
  });

  it('returns false when dataset has no children', () => {
    const dataset = { name: 'pool/dataset' } as DatasetDetails;
    expect(doesDatasetHaveShares(dataset)).toBe(false);
  });

  it('returns false when children have no shares', () => {
    const dataset = {
      name: 'pool/dataset',
      children: [
        { name: 'pool/dataset/child' } as DatasetDetails,
      ],
    } as DatasetDetails;
    expect(doesDatasetHaveShares(dataset)).toBe(false);
  });
});
