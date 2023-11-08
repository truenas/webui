import { convertObjectKeysToHumanReadable, toHumanReadableKey } from 'app/helpers/object-object-keys-to-human-readable.helper';

const specObject = {
  firstName: 'Alex',
  last_name: 'Test',
  address: {
    post_code: 55555,
    private_house: {
      street: 'Grace Street 1',
      nested: {
        value: 1,
      },
    },
  },
};

describe('Converts object to human readable', () => {
  it('converts key string to human readable', () => {
    expect(toHumanReadableKey('not_user_friendly')).toBe('Not User Friendly');
    expect(toHumanReadableKey('notUserFriendly')).toBe('Not User Friendly');
    expect(toHumanReadableKey('not-user-friendly')).toBe('Not User Friendly');
  });

  it('converts whole object to human readable keys', () => {
    expect(convertObjectKeysToHumanReadable(specObject)).toEqual({
      'First Name': 'Alex',
      'Last Name': 'Test',
      'Address': {
        'Post Code': 55555,
        'Private House': {
          'Street': 'Grace Street 1',
          'Nested': {
            'Value': 1,
          },
        },
      },
    });
  });
});
