<template>
  <div class="min-h-screen bg-slate-50/50 pb-12 selection:bg-indigo-500 selection:text-white">
    <div class="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      
      <header class="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 gap-4">
        <div>
          <div class="flex items-center space-x-2 text-xs font-bold tracking-widest text-indigo-600 uppercase">
            <span>Проект Генеалогии</span>
            <span>•</span>
            <span>Аналитика</span>
          </div>
          <h1 class="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Генеалогическое древо
          </h1>
        </div>
        <div class="text-sm text-slate-500 max-w-sm md:text-right">
          Интерактивный анализ близости родственных узлов на базе графовых алгоритмов (BFS).
        </div>
      </header>

      <KinshipSelector 
        v-model="rootPersonId" 
        :persons="persons" 
      />

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <FamilyGraph 
          :persons="persons" 
          :rootPersonId="rootPersonId"
        />

        <KinshipTable 
          :tableData="tableData" 
          :rootPersonId="rootPersonId" 
          :rootPersonName="rootPersonName" 
          @select-root="rootPersonId = $event"
        />
      </div>
      
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import KinshipSelector from './components/KinshipSelector.vue'
import FamilyGraph from './components/FamilyGraph.vue'
import KinshipTable from './components/KinshipTable.vue'

// Моковые данные, построенные строго по вашей GraphQL-схеме типов Person
const persons = ref([
  { id: "1", firstname: "Иван", fullname: "Иванов Иван Петрович", father: "3", mother: "4", spouse: "2", gender: "male", isalive: true },
  { id: "2", firstname: "Елена", fullname: "Иванова Елена Сергеевна", father: null, mother: null, spouse: "1", gender: "female", isalive: true },
  { id: "3", firstname: "Пётр", fullname: "Иванов Пётр Васильевич", father: null, mother: null, spouse: "4", gender: "male", isalive: false },
  { id: "4", firstname: "Мария", fullname: "Иванова Мария Ивановна", father: null, mother: null, spouse: "3", gender: "female", isalive: true },
  { id: "5", firstname: "Анна", fullname: "Иванова Анна Ивановна", father: "1", mother: "2", spouse: null, gender: "female", isalive: true },
  { id: "6", firstname: "Сергей", fullname: "Петров Сергей Владимирович", father: null, mother: null, spouse: null, gender: "male", isalive: true }
])

const rootPersonId = ref("1")

const rootPersonName = computed(() => {
  const p = persons.value.find(x => x.id === rootPersonId.value)
  return p ? p.firstname : ''
})

// Алгоритм поиска в ширину (BFS) для расчета степени родства
const kinshipDegrees = computed(() => {
  const degrees = {}
  persons.value.forEach(p => { degrees[p.id] = Infinity })
  if (!rootPersonId.value || !degrees.hasOwnProperty(rootPersonId.value)) return degrees

  const adjList = {}
  persons.value.forEach(p => {
    if (!adjList[p.id]) adjList[p.id] = new Set()
    if (p.father) { adjList[p.id].add(p.father); if (!adjList[p.father]) adjList[p.father] = new Set(); adjList[p.father].add(p.id); }
    if (p.mother) { adjList[p.id].add(p.mother); if (!adjList[p.mother]) adjList[p.mother] = new Set(); adjList[p.mother].add(p.id); }
    if (p.spouse) { adjList[p.id].add(p.spouse); if (!adjList[p.spouse]) adjList[p.spouse] = new Set(); adjList[p.spouse].add(p.id); }
  })

  const queue = [rootPersonId.value]
  degrees[rootPersonId.value] = 0

  while (queue.length > 0) {
    const current = queue.shift()
    const currentDist = degrees[current]
    const neighbors = adjList[current] || []
    for (const neighbor of neighbors) {
      if (degrees[neighbor] === Infinity) {
        degrees[neighbor] = currentDist + 1
        queue.push(neighbor)
      }
    }
  }
  return degrees
})

// Сортировка таблицы: сначала выбранный ('0'), далее по степени удаленности
const tableData = computed(() => {
  return persons.value.map(p => ({
    ...p,
    degree: kinshipDegrees.value[p.id]
  })).sort((a, b) => a.degree - b.degree)
})
</script>