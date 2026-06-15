export enum UserRole {
  EMPLOYEE = 'employee',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  department: string;
  role: UserRole;
  created_at: string;
}

export type UserProfilePatch = Partial<Pick<User, 'name' | 'email' | 'avatar' | 'department'>>;
