import { formatDistanceToNow } from 'date-fns';
import { formatDistanceToNowShortened } from './format-distance-to-now-shortened';

jest.mock('date-fns', () => ({
  formatDistanceToNow: jest.fn(),
}));

describe('formatDistanceToNowShortened', () => {
  it('removes "about" prefix', () => {
    (formatDistanceToNow as jest.Mock).mockReturnValue('about 2 minutes ago');
    expect(formatDistanceToNowShortened(new Date())).toBe('2 min. ago');
  });

  it('removes "almost" prefix', () => {
    (formatDistanceToNow as jest.Mock).mockReturnValue('in almost 6 years');
    expect(formatDistanceToNowShortened(new Date())).toBe('in 6 years');
  });

  it('removes "over" prefix', () => {
    (formatDistanceToNow as jest.Mock).mockReturnValue('over 3 years ago');
    expect(formatDistanceToNowShortened(new Date())).toBe('3 years ago');
  });

  it('shortens plural minutes', () => {
    (formatDistanceToNow as jest.Mock).mockReturnValue('5 minutes ago');
    expect(formatDistanceToNowShortened(new Date())).toBe('5 min. ago');
  });

  it('shortens singular minute', () => {
    (formatDistanceToNow as jest.Mock).mockReturnValue('1 minute ago');
    expect(formatDistanceToNowShortened(new Date())).toBe('1 min. ago');
  });

  it('shortens plural seconds', () => {
    (formatDistanceToNow as jest.Mock).mockReturnValue('30 seconds ago');
    expect(formatDistanceToNowShortened(new Date())).toBe('30 sec. ago');
  });

  it('shortens singular second', () => {
    (formatDistanceToNow as jest.Mock).mockReturnValue('1 second ago');
    expect(formatDistanceToNowShortened(new Date())).toBe('1 sec. ago');
  });

  it('applies multiple replacements', () => {
    (formatDistanceToNow as jest.Mock).mockReturnValue('about 2 minutes ago');
    expect(formatDistanceToNowShortened(new Date())).toBe('2 min. ago');
  });
});
