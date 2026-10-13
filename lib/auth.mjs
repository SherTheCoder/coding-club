import {createClient} from '@supabase/supabase-js';

export function createClubClient(url,key,{storage,fetch}={}) {
  return createClient(url,key,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,...(storage?{storage}:{})},
    ...(fetch?{global:{fetch}}:{})
  });
}

export async function signOutThisDevice(client) {
  const {error}=await client.auth.signOut({scope:'local'});
  if(error)throw error;
}
