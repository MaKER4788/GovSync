'use server';

import { getUserByEmail } from './users';
import { encrypt } from './session';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string;
  const user = getUserByEmail(email);
  if (!user) {
    return { error: 'Invalid credentials' };
  }
  const session = await encrypt({ userId: user.id, role: user.role, department: user.department });
  const cookieStore = await cookies();
  cookieStore.set('govsync_session', session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24,
    path: '/',
  });
  redirect('/dashboard');
}