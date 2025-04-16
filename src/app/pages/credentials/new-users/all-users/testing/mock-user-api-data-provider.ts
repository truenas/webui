import { of } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { ApiDataProvider } from 'app/modules/ix-table/classes/api-data-provider/api-data-provider';

export const mockUsers = [
  {
    id: 1,
    uid: 1,
    builtin: false,
    username: 'john_doe',
    full_name: 'John Doe',
    locked: false,
    roles: [Role.FullAdmin],
  },
  {
    id: 2,
    uid: 2,
    username: 'jane_smith',
    full_name: 'Jane Smith',
    locked: false,
    builtin: true,
    roles: [Role.FullAdmin],
  },
] as User[];

export const mockUserApiDataProvider = {
  currentPage$: of(mockUsers),
  load: jest.fn(),
  setPagination: jest.fn(),
  setParams: jest.fn(),
  sorting: {
    propertyName: 'message_timestamp',
    direction: 'desc',
    active: 1,
  },
  pagination: {
    pageSize: 10,
    pageNumber: 1,
  },
  sortingOrPaginationUpdate: of(true),
} as unknown as ApiDataProvider<'user.query'>;
