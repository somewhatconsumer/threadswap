import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'
import type { Profile } from '@/types/database'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
  const session = ref<Session | null>(null)
  const initialized = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  async function init() {
    const { data: { session: s } } = await supabase.auth.getSession()
    session.value = s
    user.value = s?.user ?? null
    if (s?.user) {
      await refreshProfile()
    }
    supabase.auth.onAuthStateChange(async (_event, s) => {
      session.value = s
      user.value = s?.user ?? null
      if (s?.user) {
        await refreshProfile()
      } else {
        profile.value = null
      }
    })
    initialized.value = true
  }

  async function refreshProfile() {
    const uid = user.value?.id
    if (!uid) {
      profile.value = null
      return
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single()
    if (error) {
      console.error('Failed to fetch profile', error)
      profile.value = null
      return
    }
    profile.value = data as Profile
  }

  function getRedirectUrl(): string | undefined {
    const base = import.meta.env.VITE_APP_URL
    if (base) return base.replace(/\/$/, '') + '/'
    if (typeof window !== 'undefined') return `${window.location.origin}/`
    return undefined
  }

  async function signInWithGoogle() {
    const redirectTo = getRedirectUrl()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: redirectTo ? { redirectTo } : undefined,
    })
    if (error) throw error
  }

  async function signUpWithEmail(email: string, password: string, displayName?: string) {
    const emailRedirectTo = getRedirectUrl()
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: emailRedirectTo ? { emailRedirectTo } : undefined,
    })
    if (error) throw error
    return data
  }

  async function signInWithEmail(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut()
    user.value = null
    profile.value = null
    session.value = null
    if (error) throw error
  }

  async function updateProfile(updates: { display_name?: string; avatar_url?: string }) {
    const uid = user.value?.id
    if (!uid) return
    const { error } = await supabase.from('profiles').update(updates).eq('id', uid)
    if (error) throw error
    await refreshProfile()
  }

  return {
    user,
    profile,
    session,
    initialized,
    isLoggedIn,
    init,
    refreshProfile,
    signInWithGoogle,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    updateProfile,
  }
})
