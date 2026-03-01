import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabase'
import type { Post } from '@/types/database'

export type PostWithAvatar = Post & { avatar_url?: string | null }

export const usePostsStore = defineStore('posts', () => {
  const posts = ref<Post[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPosts() {
    loading.value = true
    error.value = null
    try {
      const { data, error: fetchError } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
      if (fetchError) throw fetchError
      posts.value = (data ?? []) as Post[]
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load posts'
      posts.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchPost(id: string): Promise<Post | null> {
    const { data, error: err } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single()
    if (err) return null
    return data as Post
  }

  async function fetchAvatarsForUserIds(userIds: string[]): Promise<Record<string, string | null>> {
    const uniq = [...new Set(userIds)]
    if (uniq.length === 0) return {}
    const { data } = await supabase.from('profiles').select('id, avatar_url').in('id', uniq)
    const map: Record<string, string | null> = {}
    for (const row of data ?? []) {
      map[(row as { id: string; avatar_url: string | null }).id] = (row as { avatar_url: string | null }).avatar_url
    }
    return map
  }

  async function updatePost(
    id: string,
    updates: {
      title?: string
      description?: string | null
      category?: string
      categories?: string[]
      lat?: number
      lng?: number
      address_label?: string | null
      image_urls?: string[]
    }
  ): Promise<{ error: Error | null }> {
    const { error: err } = await supabase.from('posts').update(updates).eq('id', id)
    if (err) return { error: new Error(err.message) }
    const idx = posts.value.findIndex((p) => p.id === id)
    if (idx !== -1 && updates.title !== undefined) {
      posts.value = [...posts.value]
      posts.value[idx] = { ...posts.value[idx], ...updates } as Post
    }
    return { error: null }
  }

  async function deletePost(id: string): Promise<{ error: Error | null }> {
    const { error: err } = await supabase.from('posts').delete().eq('id', id)
    if (err) return { error: new Error(err.message) }
    posts.value = posts.value.filter((p) => p.id !== id)
    return { error: null }
  }

  return { posts, loading, error, fetchPosts, fetchPost, fetchAvatarsForUserIds, updatePost, deletePost }
})
