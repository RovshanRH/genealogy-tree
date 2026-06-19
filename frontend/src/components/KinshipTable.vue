<template>
  <div class="border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm bg-white flex flex-col h-[600px] transition-all duration-300 hover:shadow-md">
    <div class="bg-slate-50/70 px-5 py-4 border-b border-slate-100 flex justify-between items-center">
      <span class="font-bold text-sm text-slate-700 tracking-wide uppercase">Списочная форма</span>
      <span class="text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md font-medium">
        База: {{ rootPersonName }}
      </span>
    </div>
    
    <div class="overflow-y-auto flex-1 custom-scrollbar">
      <table class="min-w-full divide-y divide-slate-100">
        <thead class="bg-slate-50/50 sticky top-0 backdrop-blur-md z-10">
          <tr>
            <th class="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ФИО</th>
            <th class="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Пол</th>
            <th class="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Статус</th>
            <th class="px-6 py-3.5 text-center text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50/30">Степень</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100 bg-white">
          <tr 
            v-for="item in tableData" 
            :key="item.id"
            :class="item.id === rootPersonId ? 'bg-indigo-50/40 font-medium' : 'hover:bg-slate-50/80'"
            class="clickable-row"
            @click="$emit('select-root', item.id)"
          >
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
              <div class="flex items-center space-x-2">
                <span :class="item.id === rootPersonId ? 'text-indigo-600 font-semibold' : 'text-slate-700'">
                  {{ item.fullname || item.firstname }}
                </span>
                <span v-if="item.id === rootPersonId" class="text-[10px] uppercase tracking-wider bg-indigo-600 text-white px-1.5 py-0.5 rounded-md">Я</span>
              </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
              <span :class="item.gender === 'male' ? 'text-sky-600' : 'text-pink-600'">
                {{ item.gender === 'male' ? '👨 Муж' : '👩 Жен' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              <span 
                :class="item.isalive ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-slate-100 text-slate-600 border-slate-200'"
                class="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border"
              >
                {{ item.isalive ? 'Жив(а)' : 'Умер(ла)' }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
              <span 
                v-if="item.degree !== Infinity" 
                :class="item.degree === 0 
                  ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-sm shadow-indigo-200' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200'"
                class="inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold"
              >
                {{ item.degree }}
              </span>
              <span v-else class="text-slate-400 text-xs italic">нет связи</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  tableData: { type: Array, required: true },
  rootPersonId: { type: String, required: true },
  rootPersonName: { type: String, required: true }
})
defineEmits(['select-root'])
</script>