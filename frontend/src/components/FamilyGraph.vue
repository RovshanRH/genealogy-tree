<template>
  <div class="border border-slate-200/80 rounded-2xl overflow-hidden shadow-sm bg-white h-[600px] flex flex-col group transition-all duration-300 hover:shadow-md">
    <div class="bg-slate-50/70 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
      <span class="font-bold text-sm text-slate-700 tracking-wide uppercase">Визуализация связей</span>
      <div class="flex items-center space-x-4 text-xs font-medium text-slate-500">
        <span class="flex items-center"><span class="w-2.5 h-2.5 rounded-full bg-sky-400 mr-1.5"></span> Мужчины</span>
        <span class="flex items-center"><span class="w-2.5 h-2.5 rounded-full bg-pink-400 mr-1.5"></span> Женщины</span>
      </div>
    </div>
    
    <div class="flex-1 relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px]">
      <v-network-graph
        :nodes="graphData.nodes"
        :edges="graphData.edges"
        :configs="graphConfigs"
        class="v-network-graph"
      >
        <template #override-node="{ nodeId, config, scale }">
          <circle
            :r="config.radius * scale"
            :fill="config.color"
            :stroke="nodeId === `node_${rootPersonId}` ? '#4f46e5' : '#ffffff'"
            :stroke-width="(nodeId === `node_${rootPersonId}` ? 3 : 2) * scale"
            class="graph-node-transition"
          />
          <circle
            v-if="nodeId === `node_${rootPersonId}`"
            :r="(config.radius - 5) * scale"
            fill="none"
            stroke="#ffffff"
            :stroke-width="1.5 * scale"
            class="graph-node-transition"
          />
        </template>

        <template #override-node-label="{ node, x, y, textAnchor, config }">
          <text
            :x="x"
            :y="y + 26"
            :text-anchor="textAnchor"
            :font-size="config.fontSize"
            font-family="ui-sans-serif, system-ui, sans-serif"
            font-weight="600"
            fill="#334155"
          >
            {{ node.label.split(' ')[0] }}
          </text>
        </template>
      </v-network-graph>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { VNetworkGraph } from 'v-network-graph'
import 'v-network-graph/lib/style.css'

const props = defineProps({
  persons: { type: Array, required: true },
  rootPersonId: { type: String, required: true }
})

const graphData = computed(() => {
  const nodes = {}
  const edges = {}
  
  props.persons.forEach(p => {
    nodes[`node_${p.id}`] = { label: p.fullname || p.firstname, gender: p.gender }
  })

  let edgeIdCounter = 1
  const addedEdges = new Set()
  const addEdge = (source, target, type) => {
    const key = [source, target].sort().join('-')
    if (!addedEdges.has(key) && source && target) {
      addedEdges.add(key)
      edges[`edge_${edgeIdCounter++}`] = { source: `node_${source}`, target: `node_${target}`, type }
    }
  }

  props.persons.forEach(p => {
    if (p.father) addEdge(p.id, p.father, 'parent')
    if (p.mother) addEdge(p.id, p.mother, 'parent')
    if (p.spouse) addEdge(p.id, p.spouse, 'spouse')
  })

  return { nodes, edges }
})

const graphConfigs = {
  view: { autoPanAndZoomOnLoad: "fit-content animate" },
  node: {
    normal: { radius: 18, color: node => node.gender === 'male' ? '#38bdf8' : '#f472b6' },
    hover: { color: "#6366f1" },
    label: { visible: true, fontSize: 12, direction: "bottom" }
  },
  edge: {
    normal: {
      dasharray: edge => edge.type === 'spouse' ? '4 4' : '0',
      width: 2.5,
      color: edge => edge.type === 'spouse' ? '#10b981' : '#cbd5e1'
    }
  },
  physics: { enabled: true, initizeMaxTicks: 140, nonlinearForce: true, stabilizationTicks: 80 }
}
</script>