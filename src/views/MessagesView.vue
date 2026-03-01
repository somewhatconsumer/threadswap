<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useMessagesStore } from '@/stores/messages'
import { supabase } from '@/lib/supabase'

const route = useRoute()
const auth = useAuthStore()
const messagesStore = useMessagesStore()

const postIdFromQuery = computed(() => route.query.postId as string | undefined)
const newMessage = ref('')
const postOwnerForNew = ref<{ id: string; title: string; ownerId: string; ownerName: string } | null>(null)

const conversations = computed(() => messagesStore.conversations)
const messages = computed(() => messagesStore.messages)
const activePostId = computed(() => messagesStore.activePostId)
const activeOtherUserId = computed(() => messagesStore.activeOtherUserId)
const activeConv = computed(() => messagesStore.activeConversation)

onMounted(async () => {
  await messagesStore.fetchConversations()
  const pid = postIdFromQuery.value
  if (pid) {
    const { data: post } = await supabase.from('posts').select('id, title, user_id').eq('id', pid).single()
    if (post && (post as { user_id: string }).user_id !== auth.user?.id) {
      const ownerId = (post as { user_id: string }).user_id
      const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', ownerId).single()
      const ownerName = (profile as { display_name: string | null } | null)?.display_name ?? 'User'
      const existing = conversations.value.find((c) => c.postId === pid && c.otherUserId === ownerId)
      if (existing) {
        await messagesStore.fetchMessages(pid, ownerId)
      } else {
        postOwnerForNew.value = {
          id: pid,
          title: (post as { title: string }).title,
          ownerId,
          ownerName,
        }
      }
    }
  }
})

watch(postIdFromQuery, async (pid) => {
  if (!pid) {
    postOwnerForNew.value = null
    return
  }
  const { data: post } = await supabase.from('posts').select('id, title, user_id').eq('id', pid).single()
  if (post && (post as { user_id: string }).user_id !== auth.user?.id) {
    const ownerId = (post as { user_id: string }).user_id
    const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', ownerId).single()
    postOwnerForNew.value = {
      id: pid,
      title: (post as { title: string }).title,
      ownerId,
      ownerName: (profile as { display_name: string | null } | null)?.display_name ?? 'User',
    }
  }
})

function selectConversation(c: { postId: string; otherUserId: string }) {
  postOwnerForNew.value = null
  messagesStore.fetchMessages(c.postId, c.otherUserId)
  const unsub = messagesStore.subscribeToMessages(c.postId, c.otherUserId)
  return unsub
}

async function openNewWithOwner() {
  const po = postOwnerForNew.value
  if (!po) return
  await messagesStore.fetchMessages(po.id, po.ownerId)
  postOwnerForNew.value = null
}

let unsubscribe: (() => void) | null = null
watch([activePostId, activeOtherUserId], () => {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
  if (activePostId.value && activeOtherUserId.value) {
    unsubscribe = messagesStore.subscribeToMessages(activePostId.value, activeOtherUserId.value)
  }
})

async function sendNewMessage() {
  const text = newMessage.value.trim()
  if (!text) return
  const postId = activePostId.value ?? postOwnerForNew.value?.id
  const otherId = activeOtherUserId.value ?? postOwnerForNew.value?.ownerId
  if (!postId || !otherId) return
  const ok = await messagesStore.sendMessage(text, postId, otherId)
  if (ok) {
    newMessage.value = ''
    postOwnerForNew.value = null
  }
}

function isFromMe(msg: { sender_id: string }) {
  return msg.sender_id === auth.user?.id
}

function formatTime(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const sameDay = d.toDateString() === now.toDateString()
  return sameDay ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : d.toLocaleDateString()
}
</script>

<template>
  <div class="messages-view">
    <aside class="conversations-list">
      <h2 class="sidebar-title">Conversations</h2>
      <div v-if="postOwnerForNew" class="new-conv-banner">
        <p class="new-conv-title">{{ postOwnerForNew.title }}</p>
        <p class="new-conv-with">{{ postOwnerForNew.ownerName }}</p>
        <button type="button" class="btn-open" @click="openNewWithOwner">Open conversation</button>
      </div>
      <ul v-if="conversations.length" class="conv-list">
        <li
          v-for="c in conversations"
          :key="`${c.postId}-${c.otherUserId}`"
          class="conv-item"
          :class="{ active: activePostId === c.postId && activeOtherUserId === c.otherUserId }"
        >
          <button type="button" class="conv-btn" @click="selectConversation(c)">
            <span class="conv-post">{{ c.postTitle }}</span>
            <span class="conv-with">{{ c.otherUserName }}</span>
            <span class="conv-preview">{{ c.lastMessage }}</span>
          </button>
        </li>
      </ul>
      <p v-else-if="!messagesStore.loading" class="empty">No conversations yet. Message someone from a post!</p>
    </aside>
    <section class="chat-panel">
      <div v-if="activeConv || postOwnerForNew" class="chat-header">
        <h3 class="chat-title">{{ activeConv?.postTitle ?? postOwnerForNew?.title ?? 'Chat' }}</h3>
        <p class="chat-with">{{ activeConv?.otherUserName ?? postOwnerForNew?.ownerName ?? '' }}</p>
      </div>
      <div v-else class="chat-header empty">
        <p>Select a conversation or start one from a post.</p>
      </div>
      <div class="messages-list" ref="messagesListRef">
        <template v-if="messagesStore.messagesLoading">
          <p class="loading-msg">Loading…</p>
        </template>
        <template v-else>
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message-row"
            :class="{ fromMe: isFromMe(msg) }"
          >
            <div class="message-bubble">
              <span class="message-text">{{ msg.content }}</span>
              <span class="message-time">{{ formatTime(msg.created_at) }}</span>
            </div>
          </div>
        </template>
      </div>
      <div v-if="activePostId && activeOtherUserId" class="chat-input-wrap">
        <input
          v-model="newMessage"
          type="text"
          class="chat-input"
          placeholder="Type a message…"
          @keydown.enter.prevent="sendNewMessage"
        />
        <button type="button" class="send-btn" @click="sendNewMessage">Send</button>
      </div>
      <div v-else-if="postOwnerForNew" class="chat-input-wrap">
        <input
          v-model="newMessage"
          type="text"
          class="chat-input"
          placeholder="Type a message to start…"
          @keydown.enter.prevent="sendNewMessage"
        />
        <button type="button" class="send-btn" @click="sendNewMessage">Send</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.messages-view {
  display: flex;
  height: calc(100vh - 60px);
  min-height: 400px;
}

.conversations-list {
  width: 280px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  background: var(--surface-elevated);
  overflow-y: auto;
}

.sidebar-title {
  margin: 0;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text);
}

.new-conv-banner {
  padding: 0.75rem 1rem;
  margin: 0 0.5rem 0.5rem;
  background: white;
  border-radius: 0.75rem;
  border: 1px solid var(--border);
}

.new-conv-title {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
}

.new-conv-with {
  margin: 0.25rem 0 0.5rem;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.btn-open {
  padding: 0.4rem 0.75rem;
  border-radius: var(--radius-btn);
  font-size: 0.9rem;
  font-weight: 600;
  background: var(--accent);
  color: white;
  border: none;
  cursor: pointer;
}

.conv-list {
  list-style: none;
  margin: 0;
  padding: 0 0 1rem;
}

.conv-item {
  margin: 0 0.5rem 0.25rem;
}

.conv-item.active .conv-btn {
  background: var(--accent);
  color: white;
}

.conv-btn {
  width: 100%;
  padding: 0.75rem;
  text-align: left;
  border: none;
  border-radius: 0.75rem;
  background: white;
  cursor: pointer;
  font-size: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.conv-post {
  font-weight: 600;
  color: var(--text);
}

.conv-with {
  font-size: 0.8rem;
  color: var(--text-muted);
}

.conv-preview {
  font-size: 0.8rem;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.empty {
  padding: 1rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.chat-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chat-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border);
  background: var(--surface-elevated);
}

.chat-header.empty {
  color: var(--text-muted);
}

.chat-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--text);
}

.chat-with {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--text-muted);
}

.messages-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.loading-msg {
  color: var(--text-muted);
  text-align: center;
  padding: 2rem;
}

.message-row {
  display: flex;
  justify-content: flex-start;
}

.message-row.fromMe {
  justify-content: flex-end;
}

.message-bubble {
  max-width: 75%;
  padding: 0.6rem 1rem;
  border-radius: 1rem;
  background: var(--border);
}

.message-row.fromMe .message-bubble {
  background: var(--accent);
  color: white;
}

.message-text {
  display: block;
}

.message-time {
  font-size: 0.7rem;
  opacity: 0.8;
  margin-top: 0.25rem;
}

.chat-input-wrap {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-top: 1px solid var(--border);
  background: var(--surface-elevated);
}

.chat-input {
  flex: 1;
  padding: 0.6rem 1rem;
  border-radius: var(--radius-btn);
  border: 1px solid var(--border);
  font-size: 1rem;
}

.send-btn {
  padding: 0.6rem 1.25rem;
  border-radius: var(--radius-btn);
  font-size: 0.95rem;
  font-weight: 600;
  background: var(--accent);
  color: white;
  border: none;
  cursor: pointer;
}
</style>
