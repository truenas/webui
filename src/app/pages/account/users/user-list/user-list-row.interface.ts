import { Option } from 'app/interfaces/option.interface';
import { User } from 'app/interfaces/user.interface';

export interface UserListRow extends User {
  gid: number;
  details: Option[];
}
