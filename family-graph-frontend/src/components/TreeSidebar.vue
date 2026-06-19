<script setup lang="ts">
import { ref } from "vue";
import type { GenealogyTree } from "../api/types";

const props = defineProps<{
  trees: GenealogyTree[];
  selectedTreeId: string | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  "select-tree": [id: string];
  "create-tree": [name: string];
  "create-person": [];
}>();

const newTreeName = ref("");
const creatingTree = ref(false);

function submitNewTree() {
  const name = newTreeName.value.trim();
  if (!name) return;
  emit("create-tree", name);
  newTreeName.value = "";
  creatingTree.value = false;
}
</script>

<template>
  <aside class="sidebar">
    <h2 class="sidebar-title">Деревья рода</h2>

    <div v-if="loading" class="hint">Загрузка…</div>
    <ul v-else class="tree-list">
      <li
        v-for="tree in props.trees"
        :key="tree.id"
        :class="['tree-item', { active: tree.id === props.selectedTreeId }]"
        @click="emit('select-tree', tree.id)"
      >
        <span class="tree-name">{{ tree.name }}</span>
        <span class="tree-count mono">{{
          tree.count_all_characters ?? 0
        }}</span>
      </li>
      <li v-if="props.trees.length === 0" class="hint">
        Деревьев пока нет
      </li>
    </ul>

    <div v-if="creatingTree" class="new-tree-form">
      <input
        v-model="newTreeName"
        type="text"
        placeholder="Название дерева"
        class="endpoint-input-like"
        @keyup.enter="submitNewTree"
        @keyup.esc="creatingTree = false"
      />
      <div class="new-tree-actions">
        <button class="btn btn-primary" @click="submitNewTree">Создать</button>
        <button class="btn btn-ghost-dark" @click="creatingTree = false">
          Отмена
        </button>
      </div>
    </div>
    <button
      v-else
      class="btn btn-ghost-dark new-tree-btn"
      @click="creatingTree = true"
    >
      + Новое дерево
    </button>

    <button
      class="btn btn-primary add-person-btn"
      :disabled="!props.selectedTreeId"
      @click="emit('create-person')"
    >
      + Добавить человека
    </button>

    <div class="legend">
      <h3 class="legend-title">Условные обозначения</h3>
      <div class="legend-row">
        <span class="dot dot-male" /> мужчина
      </div>
      <div class="legend-row">
        <span class="dot dot-female" /> женщина
      </div>
      <div class="legend-row">
        <span class="dot dot-dead" /> умер(ла)
      </div>
      <div class="legend-row">
        <span class="line line-spouse" /> супруги
      </div>
      <div class="legend-row">
        <span class="line line-parent" /> родитель → ребёнок
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 240px;
  flex-shrink: 0;
  background: var(--ink-light);
  border-right: 1px solid rgba(237, 230, 214, 0.12);
  padding: 18px 16px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.sidebar-title {
  font-size: 16px;
  color: var(--gold);
  margin-bottom: 12px;
}

.hint {
  font-size: 12px;
  color: rgba(237, 230, 214, 0.45);
  padding: 6px 0;
}

.tree-list {
  list-style: none;
  margin: 0 0 12px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tree-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
}

.tree-item:hover {
  background: rgba(237, 230, 214, 0.06);
}

.tree-item.active {
  background: rgba(201, 162, 39, 0.16);
  border-color: rgba(201, 162, 39, 0.4);
}

.tree-name {
  font-size: 13px;
}

.tree-count {
  font-size: 11px;
}

.new-tree-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.endpoint-input-like {
  border: 1px solid rgba(237, 230, 214, 0.25);
  background: rgba(237, 230, 214, 0.06);
  color: var(--text-on-ink);
  border-radius: 6px;
  padding: 6px 9px;
  font-size: 13px;
}

.new-tree-actions {
  display: flex;
  gap: 8px;
}

.new-tree-btn {
  margin-bottom: 16px;
}

.add-person-btn {
  margin-bottom: 22px;
}

.legend {
  margin-top: auto;
  padding-top: 14px;
  border-top: 1px solid rgba(237, 230, 214, 0.12);
}

.legend-title {
  font-size: 12px;
  color: rgba(237, 230, 214, 0.5);
  margin-bottom: 8px;
  font-family: var(--font-body);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.legend-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: rgba(237, 230, 214, 0.75);
  margin-bottom: 6px;
}

.dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  flex-shrink: 0;
  display: inline-block;
}
.dot-male {
  background: var(--male);
}
.dot-female {
  background: var(--female);
}
.dot-dead {
  background: var(--neutral);
  border: 2px dashed var(--dead-stroke);
}

.line {
  width: 18px;
  height: 0;
  border-top: 2px solid;
  flex-shrink: 0;
  display: inline-block;
}
.line-spouse {
  border-top-style: dashed;
  border-color: var(--gold-dim);
}
.line-parent {
  border-color: var(--male);
}
</style>
