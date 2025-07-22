import { dump } from 'js-yaml';
import { jsonToYaml } from './json-to-yaml.helper';

jest.mock('js-yaml', () => ({
  dump: jest.fn(),
}));

describe('jsonToYaml', () => {
  it('converts json to yaml string', () => {
    (dump as jest.Mock).mockReturnValue('a: 1\n');
    expect(jsonToYaml({ a: 1 })).toBe('a: 1\n');
  });

  it('logs error and returns translation on failure', () => {
    const error = new Error('fail');
    (dump as jest.Mock).mockImplementation(() => {
      throw error;
    });
    const spy = jest.spyOn(console, 'error').mockImplementation();
    expect(jsonToYaml({})).toBe('Error occurred');
    expect(spy).toHaveBeenCalledWith(error);
    spy.mockRestore();
  });
});
