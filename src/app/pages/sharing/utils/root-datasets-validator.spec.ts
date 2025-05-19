import { FormControl } from '@angular/forms';
import { getRootDatasetsValidator } from 'app/pages/sharing/utils/root-datasets-validator';

describe('getRootDatasetsValidator', () => {
  let pathControl: FormControl<string>;
  let splitPathControl: FormControl<string[]>;
  beforeEach(() => {
    pathControl = new FormControl<string>('');
    splitPathControl = new FormControl<string[]>(['']);
  });

  it('allows path that is not root dataset', () => {
    pathControl.setValue('/mnt/pool/ds');
    splitPathControl.setValue(['mnt', 'pool', 'ds']);
    expect(getRootDatasetsValidator()(pathControl)).toBeTruthy();
    expect(getRootDatasetsValidator()(splitPathControl)).toBeTruthy();
  });

  it('does not allow root datasets', () => {
    pathControl.setValue('/mnt/pool');
    splitPathControl.setValue(['mnt', 'pool']);
    expect(getRootDatasetsValidator()(pathControl)).toBeFalsy();
    expect(getRootDatasetsValidator()(splitPathControl)).toBeFalsy();
  });

  it('allows allowed root datasets', () => {
    pathControl.setValue('/mnt/pool');
    splitPathControl.setValue(['mnt', 'pool']);
    expect(getRootDatasetsValidator(['/mnt/pool'])(pathControl)).toBeTruthy();
    expect(getRootDatasetsValidator(['/mnt/pool'])(splitPathControl)).toBeTruthy();
  });

  it('allows empty path', () => {
    pathControl.setValue('');
    splitPathControl.setValue(['']);
    expect(getRootDatasetsValidator()(pathControl)).toBeTruthy();
    expect(getRootDatasetsValidator()(splitPathControl)).toBeTruthy();
  });

  it('allows child path with mnt in name', () => {
    pathControl.setValue('/mnt/pool/mnt');
    splitPathControl.setValue(['mnt', 'pool', 'mnt']);
    expect(getRootDatasetsValidator()(pathControl)).toBeTruthy();
    expect(getRootDatasetsValidator()(splitPathControl)).toBeTruthy();
  });
});
