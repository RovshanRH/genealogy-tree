<script setup lang="ts">
import type { FamilyTreeNode } from "../composables/useGenealogy";
import TreeListNode from "./TreeListNode.vue";

const props = defineProps<{
  roots: FamilyTreeNode[];
  selectedId: string | null;
}>();

const emit = defineEmits<{ "select-person": [id: string] }>();
</script>

<template>
  <div class="list-view">
    <ul v-if="props.roots.length" class="root-list">
      <TreeListNode
        v-for="root in props.roots"
        :key="root.person.id"
        :node="root"
        :selected-id="selectedId"
        :depth="0"
        @select-person="(id) => emit('select-person', id)"
      />
    </ul>
    <div v-else class="empty-hint">
      В этом дереве пока нет персонажей. Нажмите «Добавить человека».
    </div>
  </div>
</template>

<style scoped>
.list-view {
  flex: 1;
  height: 100%;
  overflow: auto;
  background: var(--ink);
  padding: 22px 26px;
}

.root-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.empty-hint {
  color: rgba(237, 230, 214, 0.45);
  font-size: 14px;
  margin-top: 40px;
  text-align: center;
}
</style>
