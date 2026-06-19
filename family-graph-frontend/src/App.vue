<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import EndpointBar from "./components/EndpointBar.vue";
import TreeSidebar from "./components/TreeSidebar.vue";
import FamilyGraphCanvas from "./components/FamilyGraphCanvas.vue";
import TreeListView from "./components/TreeListView.vue";
import PersonPanel from "./components/PersonPanel.vue";
import PersonForm, { type RelativeOption } from "./components/PersonForm.vue";
import { useGenealogy } from "./composables/useGenealogy";
import type { CreatePersonInput, UpdatePersonInput } from "./api/types";

const g = useGenealogy();

onMounted(() => {
  g.loadAll();
});

const viewMode = ref<"graph" | "list">("graph");

// --- форма создания/редактирования -----------------------------------------

const formMode = ref<"create" | "edit" | null>(null);
const formSubmitting = ref(false);
const formError = ref<string | null>(null);

const relativeOptions = computed<RelativeOption[]>(() =>
  g.filteredPersons.value.map((p) => ({
    id: p.id,
    label: p.fullname?.trim() || p.firstname,
  })),
);

function openCreateForm() {
  formError.value = null;
  formMode.value = "create";
}

function openEditForm() {
  if (!g.selectedPersonDetail.value) return;
  formError.value = null;
  formMode.value = "edit";
}

function closeForm() {
  formMode.value = null;
  formError.value = null;
}

async function handleFormSubmit(payload: CreatePersonInput | UpdatePersonInput) {
  formSubmitting.value = true;
  formError.value = null;
  try {
    if (formMode.value === "create") {
      await g.submitCreatePerson(payload as CreatePersonInput);
    } else if (formMode.value === "edit" && g.selectedPersonId.value) {
      await g.submitUpdatePerson(g.selectedPersonId.value, payload as UpdatePersonInput);
    }
    closeForm();
  } catch (e) {
    formError.value = (e as Error).message;
  } finally {
    formSubmitting.value = false;
  }
}

// --- действия над деревьями/персонажами -------------------------------------

async function handleCreateTree(name: string) {
  try {
    await g.addTree(name);
  } catch (e) {
    g.error.value = (e as Error).message;
  }
}

function handleSelectTree(id: string) {
  g.selectedTreeId.value = id;
  g.selectPerson(null);
}

async function handleDelete() {
  if (!g.selectedPersonId.value) return;
  try {
    await g.removePerson(g.selectedPersonId.value);
  } catch (e) {
    g.error.value = (e as Error).message;
  }
}
</script>

<template>
  <div class="app-shell">
    <EndpointBar @reload="g.loadAll()" />

    <div class="view-switch-bar">
      <button
        class="view-tab"
        :class="{ active: viewMode === 'graph' }"
        @click="viewMode = 'graph'"
      >
        Граф
      </button>
      <button
        class="view-tab"
        :class="{ active: viewMode === 'list' }"
        @click="viewMode = 'list'"
      >
        Список
      </button>
    </div>

    <div v-if="g.error.value" class="global-error">{{ g.error.value }}</div>

    <div class="app-body">
      <TreeSidebar
        :trees="g.trees.value"
        :selected-tree-id="g.selectedTreeId.value"
        :loading="g.loading.value"
        @select-tree="handleSelectTree"
        @create-tree="handleCreateTree"
        @create-person="openCreateForm"
      />

      <FamilyGraphCanvas
        v-if="viewMode === 'graph'"
        :nodes="g.nodes.value"
        :edges="g.edges.value"
        :layouts="g.layouts.value"
        @select-person="(id) => g.selectPerson(id)"
      />
      <TreeListView
        v-else
        :roots="g.familyTree.value"
        :selected-id="g.selectedPersonId.value"
        @select-person="(id) => g.selectPerson(id)"
      />

      <PersonPanel
        :detail="g.selectedPersonDetail.value"
        :loading="g.detailLoading.value"
        @close="g.selectPerson(null)"
        @edit="openEditForm"
        @delete="handleDelete"
        @select-person="(id) => g.selectPerson(id)"
      />
    </div>

    <PersonForm
      v-if="formMode"
      :mode="formMode"
      :tree-id="g.selectedTreeId.value"
      :initial-detail="formMode === 'edit' ? g.selectedPersonDetail.value : null"
      :relative-options="relativeOptions"
      :submitting="formSubmitting"
      :error-message="formError"
      @submit="handleFormSubmit"
      @cancel="closeForm"
    />
  </div>
</template>

<style scoped>
.app-shell {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.app-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

.global-error {
  background: rgba(154, 51, 36, 0.85);
  color: #fff;
  font-size: 13px;
  padding: 8px 18px;
}

.view-switch-bar {
  display: flex;
  gap: 4px;
  padding: 8px 18px 0;
  background: var(--ink);
}

.view-tab {
  background: transparent;
  border: 1px solid rgba(237, 230, 214, 0.18);
  border-bottom-color: transparent;
  border-radius: 8px 8px 0 0;
  color: rgba(237, 230, 214, 0.55);
  font-size: 12px;
  padding: 7px 16px;
  font-family: var(--font-display);
  letter-spacing: 0.02em;
}

.view-tab:hover {
  color: var(--text-on-ink);
}

.view-tab.active {
  background: var(--ink-light);
  color: var(--gold);
  border-color: rgba(237, 230, 214, 0.18);
}
</style>
