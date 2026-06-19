<script setup lang="ts">
import { ref } from "vue";
import { graphqlEndpoint, setGraphqlEndpoint } from "../api/client";

const emit = defineEmits<{ reload: [] }>();

const draft = ref(graphqlEndpoint.value);
const editing = ref(!graphqlEndpoint.value);

function save() {
  setGraphqlEndpoint(draft.value);
  editing.value = false;
  emit("reload");
}
</script>

<template>
  <div class="endpoint-bar">
    <span class="endpoint-label">API</span>

    <template v-if="editing">
      <input
        v-model="draft"
        type="text"
        placeholder="https://example.com/graphql"
        class="endpoint-input"
        @keyup.enter="save"
      />
      <button class="btn btn-primary" @click="save">Подключиться</button>
    </template>

    <template v-else>
      <span class="endpoint-value mono" :title="graphqlEndpoint">{{
        graphqlEndpoint
      }}</span>
      <button class="btn btn-ghost-dark" @click="editing = true">
        Изменить
      </button>
      <button class="btn btn-ghost-dark" @click="emit('reload')">
        Обновить данные
      </button>
    </template>
  </div>
</template>

<style scoped>
.endpoint-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 18px;
  background: var(--ink-light);
  border-bottom: 1px solid rgba(237, 230, 214, 0.12);
}

.endpoint-label {
  font-family: var(--font-display);
  font-size: 13px;
  letter-spacing: 0.04em;
  color: var(--gold);
  flex-shrink: 0;
}

.endpoint-input {
  flex: 1;
  max-width: 480px;
  border: 1px solid rgba(237, 230, 214, 0.25);
  background: rgba(237, 230, 214, 0.06);
  color: var(--text-on-ink);
  border-radius: 6px;
  padding: 6px 10px;
  font-family: var(--font-mono);
  font-size: 12px;
}

.endpoint-value {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: rgba(237, 230, 214, 0.7);
}
</style>
