export type UserRole = 'CITIZEN' | 'DEPARTMENT_OFFICER' | 'ADMIN';
export type Department = 'REVENUE' | 'POLLUTION' | 'FIRE' | 'LABOUR';

export interface GovSyncUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: Department;
}

export const demoUsers: Record<string, GovSyncUser> = {
  'citizen@govsync.demo': {
    id: '1',
    name: 'Demo Citizen',
    email: 'citizen@govsync.demo',
    role: 'CITIZEN',
  },
  'revenue.officer@govsync.demo': {
    id: '2',
    name: 'Revenue Officer',
    email: 'revenue.officer@govsync.demo',
    role: 'DEPARTMENT_OFFICER',
    department: 'REVENUE',
  },
  'pollution.officer@govsync.demo': {
    id: '3',
    name: 'Pollution Officer',
    email: 'pollution.officer@govsync.demo',
    role: 'DEPARTMENT_OFFICER',
    department: 'POLLUTION',
  },
  'fire.officer@govsync.demo': {
    id: '4',
    name: 'Fire Officer',
    email: 'fire.officer@govsync.demo',
    role: 'DEPARTMENT_OFFICER',
    department: 'FIRE',
  },
  'labour.officer@govsync.demo': {
    id: '5',
    name: 'Labour Officer',
    email: 'labour.officer@govsync.demo',
    role: 'DEPARTMENT_OFFICER',
    department: 'LABOUR',
  },
  'admin@govsync.demo': {
    id: '6',
    name: 'GovSync Administrator',
    email: 'admin@govsync.demo',
    role: 'ADMIN',
  },
};

export function getUserByEmail(email: string): GovSyncUser | undefined {
  return demoUsers[email];
}