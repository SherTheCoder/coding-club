import { createClient } from '@supabase/supabase-js';

export function createClubClient(url, key, { storage, fetch } = {}) {
  return createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      ...(storage ? { storage } : {}),
    },
    ...(fetch ? { global: { fetch } } : {}),
  });
}

export async function signOutThisDevice(client) {
  const { error } = await client.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function signInMember(client, email, password) {
  const { error } = await client.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });
  if (error) throw error;
}

export async function changeMemberPassword(client, currentPassword, password) {
  if (password.length < 12) throw new Error('Use at least 12 characters.');
  const {
    data: { session },
    error,
  } = await client.auth.getSession();
  if (error) throw error;
  if (!session?.user.email) throw new Error('Sign in first.');
  await signInMember(client, session.user.email, currentPassword);
  const { error: updateError } = await client.auth.updateUser({
    password,
    current_password: currentPassword,
  });
  if (updateError) throw updateError;
}
