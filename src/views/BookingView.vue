<script setup>
import { computed, reactive, ref } from 'vue'
import { CalendarPlus, ChevronLeft, ChevronRight, Trash2 } from 'lucide-vue-next'
import AuthGate from '../components/AuthGate.vue'
import { useLabStore } from '../stores/labStore'

const store = useLabStore()
const selectedDate = ref(store.todayString())
const selectedRoom = ref(store.state.rooms[0]?.id || '')
const form = reactive({
  start_time: '09:00',
  end_time: '10:00',
  reason: '',
})
const error = ref('')

const bookings = computed(() =>
  store.state.bookings
    .filter((item) => item.date === selectedDate.value && item.room_id === selectedRoom.value)
    .sort((a, b) => a.start_time.localeCompare(b.start_time)),
)

function memberName(id) {
  return store.state.members.find((item) => item.id === id)?.name || '未知成员'
}

function roomName(id) {
  return store.state.rooms.find((item) => item.id === id)?.name || '会议室'
}

function shiftDay(step) {
  const date = new Date(`${selectedDate.value}T00:00:00`)
  date.setDate(date.getDate() + step)
  selectedDate.value = date.toISOString().slice(0, 10)
}

function submitBooking() {
  const result = store.addBooking({
    room_id: selectedRoom.value,
    date: selectedDate.value,
    ...form,
  })
  error.value = result.ok ? '' : result.message
  if (result.ok) form.reason = ''
}
</script>

<template>
  <AuthGate tool-id="booking" title="会议室预约" subtitle="选择日期和时段预约实验室会议室，系统会检查同一会议室时段冲突。">
    <div class="tool-actions">
      <button class="button button-light" type="button" @click="shiftDay(-1)">
        <ChevronLeft :size="16" />
        前一天
      </button>
      <input v-model="selectedDate" class="date-input date-input-box" type="date" />
      <button class="button button-light" type="button" @click="shiftDay(1)">
        后一天
        <ChevronRight :size="16" />
      </button>
    </div>

    <div class="room-tabs">
      <button
        v-for="room in store.state.rooms"
        :key="room.id"
        class="room-tab"
        :class="{ active: selectedRoom === room.id }"
        type="button"
        @click="selectedRoom = room.id"
      >
        {{ room.name }} <span v-if="room.capacity">({{ room.capacity }}人)</span>
      </button>
    </div>

    <form class="tool-form" @submit.prevent="submitBooking">
      <div class="form-row">
        <div class="form-field">
          <label for="start-time">开始时间</label>
          <input id="start-time" v-model="form.start_time" type="time" />
        </div>
        <div class="form-field">
          <label for="end-time">结束时间</label>
          <input id="end-time" v-model="form.end_time" type="time" />
        </div>
      </div>
      <div class="form-field">
        <label for="booking-reason">事由</label>
        <input id="booking-reason" v-model="form.reason" type="text" placeholder="简述使用事由" />
      </div>
      <div v-if="error" class="form-error">{{ error }}</div>
      <button class="button button-dark" type="submit">
        <CalendarPlus :size="16" />
        确认预约
      </button>
    </form>

    <div class="booking-list">
      <article v-for="item in bookings" :key="item.id" class="booking-item">
        <div class="booking-time">
          {{ item.start_time }}
          <span class="booking-time-sep">-</span>
          {{ item.end_time }}
        </div>
        <div class="booking-body">
          <strong>{{ item.reason }}</strong>
          <span>{{ roomName(item.room_id) }} · 预约人：{{ memberName(item.member_id) }}</span>
        </div>
        <button class="booking-delete" type="button" title="取消预约" @click="store.deleteBooking(item.id)">
          <Trash2 :size="15" />
        </button>
      </article>
      <div v-if="bookings.length === 0" class="tool-empty inline-empty">
        <p>当天暂无预约</p>
        <span>点击「确认预约」添加一条记录。</span>
      </div>
    </div>
  </AuthGate>
</template>
