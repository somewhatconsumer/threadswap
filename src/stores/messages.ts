import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/stores/auth'
import type { Message } from '@/types/database'

export type Conversation = {
  postId: string
  postTitle: string
  otherUserId: string
  otherUserName: string
  lastMessage: string
  lastAt: string
  unread?: boolean
}

export const useMessagesStore = defineStore('messages', () => {
  const auth = useAuthStore()
  const conversations = ref<Conversation[]>([])
  const messages = ref<Message[]>([])
  const activePostId = ref<string | null>(null)
  const activeOtherUserId = ref<string | null>(null)
  const loading = ref(false)
  const messagesLoading = ref(false)
  const error = ref<string | null>(null)

  const activeConversation = computed(() => {
    if (!activePostId.value || !activeOtherUserId.value) return null
    return conversations.value.find(
      (c) => c.postId === activePostId.value && c.otherUserId === activeOtherUserId.value
    ) ?? null
  })

  async function fetchConversations() {
    const uid = auth.user?.id
    if (!uid) return
    loading.value = true
    error.value = null
    try {
      const { data: msgs, error: err } = await supabase
        .from('messages')
        .select('id, post_id, sender_id, receiver_id, content, created_at')
        .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
        .order('created_at', { ascending: false })
      if (err) throw err
      const list = (msgs ?? []) as Message[]

      const { data: postsData } = await supabase.from('posts').select('id, title').in('id', [...new Set(list.map((m) => m.post_id))])
      const postsMap = new Map((postsData ?? []).map((p: { id: string; title: string }) => [p.id, p.title]))

      const { data: profilesData } = await supabase.from('profiles').select('id, display_name')
      const profilesMap = new Map((profilesData ?? []).map((p: { id: string; display_name: string | null }) => [p.id, p.display_name ?? 'User']))

      const seen = new Set<string>()
      const convs: Conversation[] = []
      for (const m of list) {
        const other = m.sender_id === uid ? m.receiver_id : m.sender_id
        const key = `${m.post_id}:${other}`
        if (seen.has(key)) continue
        seen.add(key)
        convs.push({
          postId: m.post_id,
          postTitle: postsMap.get(m.post_id) ?? 'Post',
          otherUserId: other,
          otherUserName: profilesMap.get(other) ?? 'User',
          lastMessage: m.content,
          lastAt: m.created_at,
        })
      }
      conversations.value = convs
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Failed to load conversations'
      conversations.value = []
    } finally {
      loading.value = false
    }
  }

  async function fetchMessages(postId: string, otherUserId: string) {
    const uid = auth.user?.id
    if (!uid) return
    activePostId.value = postId
    activeOtherUserId.value = otherUserId
    messagesLoading.value = true
    try {
      const { data, error: err } = await supabase
        .from('messages')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })
      if (err) throw err
      const all = (data ?? []) as Message[]
      messages.value = all.filter(
        (m) =>
          (m.sender_id === uid && m.receiver_id === otherUserId) ||
          (m.sender_id === otherUserId && m.receiver_id === uid)
      )
    } catch (e) {
      messages.value = []
    } finally {
      messagesLoading.value = false
    }
  }

  async function sendMessage(content: string, postId: string, receiverId: string): Promise<boolean> {
    const uid = auth.user?.id
    if (!uid) return false
    const { data: post } = await supabase.from('posts').select('user_id').eq('id', postId).single()
    if (!post || (post as { user_id: string }).user_id !== receiverId) return false
    const { error: err } = await supabase.from('messages').insert({
      post_id: postId,
      sender_id: uid,
      receiver_id: receiverId,
      content: content.trim(),
    })
    if (err) return false
    await fetchMessages(postId, receiverId)
    await fetchConversations()
    return true
  }

  function setActive(postId: string | null, otherUserId: string | null) {
    activePostId.value = postId
    activeOtherUserId.value = otherUserId
    messages.value = []
  }

  function subscribeToMessages(postId: string, otherUserId: string) {
    const uid = auth.user?.id
    if (!uid) return () => {}
    const channel = supabase
      .channel(`messages:${postId}:${otherUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `post_id=eq.${postId}`,
        },
        () => {
          fetchMessages(postId, otherUserId)
        }
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }

  return {
    conversations,
    messages,
    activePostId,
    activeOtherUserId,
    activeConversation,
    loading,
    messagesLoading,
    error,
    fetchConversations,
    fetchMessages,
    sendMessage,
    setActive,
    subscribeToMessages,
  }
})
