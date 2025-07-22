import { formatDistanceToNow } from 'date-fns';
import { formatDistanceToNowShortened } from './format-distance-to-now-shortened';

jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(),
}));

describe('formatDistanceToNowShortened', () => {
  it('shortens minutes', () => {
    (formatDistanceToNow as jest.Mock).mockReturnValue('about 2 minutes ago');
    expect(formatDistanceToNowShortened(new Date())).toBe('2 min. ago');
  });

  it('shortens seconds', () => {
    (formatDistanceToNow as jest.Mock).mockReturnValue('about 5 seconds ago');
    expect(formatDistanceToNowShortened(new Date())).toBe('5 sec. ago');
  });
});
