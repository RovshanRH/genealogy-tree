<script setup lang="ts">
import type { FamilyTreeNode } from "../composables/useGenealogy";

defineProps<{
  node: FamilyTreeNode;
  selectedId: string | null;
  depth: number;
}>();

const emit = defineEmits<{ "select-person": [id: string] }>();

function label(p: { fullname: string | null; firstname: string }): string {
  return p.fullname?.trim() || p.firstname;
}
</script>

<template>
  <li class="node">
    <div class="row">
      <button
        class="name-btn"
        :class="[
          node.person.gender === 'female' ? 'female' : 'male',
          { dead: node.person.isalive === false, active: node.person.id === selectedId },
        ]"
        @click="emit('select-person', node.person.id)"
      >
        {{ label(node.person) }}
      </button>

      <template v-if="node.spouse">
        <span class="union">⚭</span>
        <button
          class="name-btn spouse-btn"
          :class="[
            node.spouse.gender === 'female' ? 'female' : 'male',
            { dead: node.spouse.isalive === false, active: node.spouse.id === selectedId },
          ]"
          @click="emit('select-person', node.spouse.id)"
        >
          {{ label(node.spouse) }}
        </button>
      </template>
    </div>

    <ul v-if="node.children.length" class="children">
      <TreeListNode
        v-for="child in node.children"
        :key="child.person.id"
        :node="child"
        :selected-id="selectedId"
        :depth="depth + 1"
        @select-person="(id) => emit('select-person', id)"
      />
    </ul>
  </li>
</template>

<style scoped>
.node {
  list-style: none;
  margin: 0;
  padding: 0;
}

.row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 3px 0;
}

.name-btn {
  background: none;
  border: none;
  padding: 2px 6px;
  border-radius: 5px;
  font-size: 13px;
  color: var(--text-on-ink);
  border-left: 3px solid transparent;
}
.name-btn:hover {
  background: rgba(237, 230, 214, 0.08);
}
.name-btn.male {
  border-left-color: var(--male);
}
.name-btn.female {
  border-left-color: var(--female);
}
.name-btn.dead {
  opacity: 0.6;
  font-style: italic;
}
.name-btn.active {
  background: rgba(201, 162, 39, 0.22);
  color: var(--gold);
}

.spouse-btn {
  font-size: 12px;
  opacity: 0.85;
}

.union {
  color: var(--gold-dim);
  font-size: 12px;
}

.children {
  list-style: none;
  margin: 0;
  padding-left: 20px;
  border-left: 1px dashed rgba(237, 230, 214, 0.18);
}
</style>
