<script setup lang="ts">
import { watch, ref } from "vue";
import { VNetworkGraph, defineConfigs } from "v-network-graph";
import type { GraphEdge, GraphNode, NodePosition } from "../composables/useGenealogy";

const props = defineProps<{
  nodes: Record<string, GraphNode>;
  edges: Record<string, GraphEdge>;
  layouts: { nodes: Record<string, NodePosition> };
}>();

const emit = defineEmits<{ "select-person": [id: string] }>();

const selectedNodes = ref<string[]>([]);

watch(selectedNodes, (ids) => {
  const id = ids[0];
  if (id) emit("select-person", id);
});

const EDGE_COLOR: Record<string, string> = {
  father: "#3f6f99",
  mother: "#b85a8d",
  spouse: "#c9a227",
};

// Примечание: v-network-graph типизирует функции стиля как (target: Node) => T,
// где Node — базовый тип библиотеки. Если параметр явно типизировать нашим
// GraphNode/GraphEdge, TS ругается на контравариантность параметров функции.
// Поэтому здесь используется `any`, а наши поля (gender, isalive, type) идут
// как раньше — они реально есть в данных в рантайме.
const configs = defineConfigs({
  view: {
    scalingObjects: true,
    minZoomLevel: 0.2,
    maxZoomLevel: 3,
  },
  node: {
    selectable: 1,
    normal: {
      radius: 22,
      color: (node: any) =>
        node.gender === "male"
          ? "#2c5f8a"
          : node.gender === "female"
            ? "#a8487a"
            : "#7a7a7a",
      strokeWidth: (node: any) => (node.isalive === false ? 2 : 0),
      strokeColor: "#16242e",
      strokeDasharray: (node: any) => (node.isalive === false ? "3 2" : "0"),
    },
    hover: {
      color: (node: any) =>
        node.gender === "male"
          ? "#3f7fad"
          : node.gender === "female"
            ? "#bd5a92"
            : "#8c8c8c",
    },
    selected: {
      strokeWidth: 3,
      strokeColor: "#c9a227",
    },
    label: {
      visible: true,
      fontFamily: "Inter, sans-serif",
      fontSize: 11,
      color: "#ede6d6",
      margin: 5,
      direction: "south",
    },
  },
  edge: {
    selectable: false,
    normal: {
      width: 2,
      color: (edge: any) => EDGE_COLOR[edge.type] ?? "#9c8b6f",
      dasharray: (edge: any) => (edge.type === "spouse" ? "5 4" : "0"),
      linecap: "round",
    },
  },
});
</script>

<template>
  <div class="graph-canvas">
    <VNetworkGraph
      v-model:selected-nodes="selectedNodes"
      :nodes="props.nodes"
      :edges="props.edges"
      :layouts="props.layouts"
      :configs="configs"
    />
    <div v-if="Object.keys(props.nodes).length === 0" class="empty-hint">
      В этом дереве пока нет персонажей. Нажмите «Добавить человека».
    </div>
  </div>
</template>

<style scoped>
.graph-canvas {
  position: relative;
  flex: 1;
  height: 100%;
  background: var(--ink);
  background-image: radial-gradient(
    circle at 1px 1px,
    rgba(237, 230, 214, 0.08) 1px,
    transparent 0
  );
  background-size: 28px 28px;
}

.graph-canvas :deep(svg) {
  width: 100%;
  height: 100%;
}

.empty-hint {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(237, 230, 214, 0.45);
  font-size: 14px;
  text-align: center;
  pointer-events: none;
}
</style>
