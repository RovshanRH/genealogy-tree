<template>
  <div class="glass-panel border border-slate-200/80 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
    <div class="flex items-center space-x-3">
      <div class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      </div>
      <div>
        <h3 class="text-sm font-semibold text-slate-800">Фокус исследования</h3>
        <p class="text-xs text-slate-500">Степень родства в таблице пересчитывается от выбранного лица</p>
      </div>
    </div>
    
    <div class="relative min-w-[280px]">
      <select 
        :value="modelValue"
        @change="$emit('update:modelValue', $event.target.value)"
        class="w-full appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all cursor-pointer"
      >
        <option v-for="person in persons" :key="person.id" :value="person.id">
          {{ person.fullname || person.firstname }}
        </option>
      </select>
      <div class="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
        <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, required: true },
  persons: { type: Array, required: true }
})
defineEmits(['update:modelValue'])
</script>