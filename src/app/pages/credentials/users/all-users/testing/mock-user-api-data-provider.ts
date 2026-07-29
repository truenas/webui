import { BehaviorSubject, of } from 'rxjs';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { User } from 'app/interfaces/user.interface';
import { UsersDataProvider } from 'app/pages/credentials/users/all-users/users-data-provider';

export const mockUsers = [
  {
    id: 1,
    uid: 1,
    builtin: false,
    local: true,
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
    local: false,
    roles: [Role.FullAdmin],
  },
] as User[];

export const mockUserApiDataProvider = {
  currentPage$: new BehaviorSubject(mockUsers),
  isLoading$: of(false),
  emptyType$: of(EmptyType.None),
  expandedRow: null,
  totalRows: mockUsers.length,
  load: jest.fn(),
  setPagination: jest.fn(),
  setParams: jest.fn(),
  setSorting: jest.fn(),
  additionalUsername: '',
  shouldLoadUser: jest.fn(),
  sorting: {
    propertyName: 'username',
    direction: 'asc',
    active: 1,
  },
  pagination: {
    pageSize: 10,
    pageNumber: 1,
  },
  sortingOrPaginationUpdate: of(true),
} as unknown as UsersDataProvider;
