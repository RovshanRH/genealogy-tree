<script setup lang="ts">
import type { PersonDetail, PersonShort } from "../api/types";

const props = defineProps<{
  detail: PersonDetail | null;
  loading: boolean;
}>();

const emit = defineEmits<{
  close: [];
  edit: [];
  delete: [];
  "select-person": [id: string];
  "add-child": [];
}>();

const MARITAL_LABELS: Record<string, string> = {
  single: "не состоит в браке",
  married: "в браке",
  divorced: "в разводе",
  widowed: "вдовец/вдова",
};

function relativeLabel(p: PersonShort | null | undefined): string {
  if (!p) return "—";
  return p.fullname?.trim() || p.firstname;
}

function formatPlace(place: PersonDetail["birth_place_obj"] | PersonDetail["death_place_obj"], dateKey: "birth_date" | "death_date", approxKey: "birth_date_approx" | "death_date_approx"): string {
  if (!place) return "—";
  const date = (place as any)[dateKey];
  const approx = (place as any)[approxKey];
  const parts: string[] = [];
  if (date) parts.push(approx ? `ок. ${date}` : date);
  if (place.city?.name) parts.push(place.city.name);
  if (place.country?.name) parts.push(place.country.name);
  return parts.length ? parts.join(", ") : "—";
}

function confirmDelete() {
  if (!props.detail) return;
  const name = relativeLabel({
    id: props.detail.id,
    firstname: props.detail.firstname,
    patronymic: props.detail.patronymic,
    fullname: props.detail.fullname,
    gender: props.detail.gender,
    isalive: props.detail.isalive,
  });
  if (window.confirm(`Удалить «${name}» без возможности восстановления?`)) {
    emit("delete");
  }
}
</script>

<template>
  <aside class="panel">
    <div v-if="loading" class="state-msg">Загрузка карточки…</div>

    <template v-else-if="detail">
      <div class="panel-header">
        <div>
          <h2 class="person-name">{{ relativeLabel(detail as any) }}</h2>
          <div class="badges">
            <span
              class="badge"
              :class="detail.gender === 'female' ? 'badge-female' : 'badge-male'"
            >
              {{ detail.gender === "female" ? "женщина" : "мужчина" }}
            </span>
            <span class="badge" :class="detail.isalive === false ? 'badge-dead' : 'badge-alive'">
              {{ detail.isalive === false ? "умер(ла)" : "жив(а)" }}
            </span>
          </div>
        </div>
        <button class="btn btn-ghost close-btn" @click="emit('close')">✕</button>
      </div>

      <dl class="fact-list">
        <template v-if="detail.age != null">
          <dt>Возраст</dt>
          <dd>{{ detail.age }}</dd>
        </template>
        <dt>Семейное положение</dt>
        <dd>{{ MARITAL_LABELS[detail.marital_status ?? ""] ?? "—" }}</dd>

        <template v-if="detail.surname_obj?.name">
          <dt>Фамилия</dt>
          <dd>{{ detail.surname_obj.name }}</dd>
        </template>
        <template v-if="detail.maidensurname_obj?.name">
          <dt>Девичья фамилия</dt>
          <dd>{{ detail.maidensurname_obj.name }}</dd>
        </template>
        <template v-if="detail.nationality_obj?.name">
          <dt>Национальность</dt>
          <dd>{{ detail.nationality_obj.name }}</dd>
        </template>
        <template v-if="detail.social_status_obj?.name">
          <dt>Соц. статус</dt>
          <dd>{{ detail.social_status_obj.name }}</dd>
        </template>

        <dt>Место рождения</dt>
        <dd>{{ formatPlace(detail.birth_place_obj, "birth_date", "birth_date_approx") }}</dd>

        <template v-if="detail.isalive === false">
          <dt>Место смерти</dt>
          <dd>{{ formatPlace(detail.death_place_obj, "death_date", "death_date_approx") }}</dd>
        </template>
      </dl>

      <section class="relatives">
        <h3 class="section-title">Семья</h3>
        <div class="relative-row">
          <span class="relative-label">Отец</span>
          <button
            v-if="detail.father_obj"
            class="chip"
            @click="emit('select-person', detail.father_obj.id)"
          >
            {{ relativeLabel(detail.father_obj) }}
          </button>
          <span v-else class="chip-empty">не указан</span>
        </div>
        <div class="relative-row">
          <span class="relative-label">Мать</span>
          <button
            v-if="detail.mother_obj"
            class="chip"
            @click="emit('select-person', detail.mother_obj.id)"
          >
            {{ relativeLabel(detail.mother_obj) }}
          </button>
          <span v-else class="chip-empty">не указана</span>
        </div>
        <div class="relative-row">
          <span class="relative-label">Супруг(а)</span>
          <button
            v-if="detail.spouse_obj"
            class="chip"
            @click="emit('select-person', detail.spouse_obj.id)"
          >
            {{ relativeLabel(detail.spouse_obj) }}
          </button>
          <span v-else class="chip-empty">не указан(а)</span>
        </div>

        <div
          v-if="(detail.children_by_father.length + detail.children_by_mother.length) > 0"
          class="relative-row children-row"
        >
          <span class="relative-label">Дети</span>
          <div class="chip-group">
            <button
              v-for="c in [...detail.children_by_father, ...detail.children_by_mother].filter(
                (c, i, arr) => arr.findIndex((x) => x.id === c.id) === i,
              )"
              :key="c.id"
              class="chip"
              @click="emit('select-person', c.id)"
            >
              {{ relativeLabel(c) }}
            </button>
          </div>
        </div>
      </section>

      <section v-if="detail.bio || detail.source_info" class="bio">
        <h3 class="section-title">Биография</h3>
        <p v-if="detail.bio" class="bio-text">{{ detail.bio }}</p>
        <p v-if="detail.source_info" class="source-text mono">
          Источник: {{ detail.source_info }}
        </p>
      </section>

      <div class="panel-actions">
        <button class="btn btn-primary" @click="emit('edit')">
          Редактировать
        </button>
        <button class="btn btn-danger" @click="confirmDelete">Удалить</button>
      </div>

      <div class="panel-id mono">id: {{ detail.id }}</div>
    </template>

    <div v-else class="state-msg">
      Выберите человека на графе, чтобы увидеть карточку.
    </div>
  </aside>
</template>

<style scoped>
.panel {
  width: 340px;
  flex-shrink: 0;
  background: var(--parchment);
  color: var(--text-on-parchment);
  border-left: 1px solid var(--line);
  padding: 20px 18px;
  overflow-y: auto;
  height: 100%;
}

.state-msg {
  color: var(--text-dim);
  font-size: 13px;
  margin-top: 40px;
  text-align: center;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 14px;
}

.person-name {
  font-size: 22px;
  line-height: 1.2;
}

.badges {
  display: flex;
  gap: 6px;
  margin-top: 8px;
}

.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 100px;
  font-weight: 500;
  letter-spacing: 0.02em;
}
.badge-male {
  background: rgba(44, 95, 138, 0.15);
  color: var(--male);
}
.badge-female {
  background: rgba(168, 72, 122, 0.15);
  color: var(--female);
}
.badge-alive {
  background: rgba(60, 110, 60, 0.15);
  color: #3c6e3c;
}
.badge-dead {
  background: rgba(91, 83, 70, 0.15);
  color: var(--dead-stroke);
}

.close-btn {
  padding: 4px 9px;
  flex-shrink: 0;
}

.fact-list {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 6px 12px;
  margin: 0 0 18px;
}
.fact-list dt {
  font-size: 12px;
  color: var(--text-dim);
}
.fact-list dd {
  margin: 0;
  font-size: 13px;
}

.section-title {
  font-size: 13px;
  color: var(--text-dim);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-family: var(--font-body);
  font-weight: 600;
  margin-bottom: 8px;
}

.relatives {
  margin-bottom: 18px;
}

.relative-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.children-row {
  align-items: flex-start;
}

.relative-label {
  width: 78px;
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-dim);
}

.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.chip {
  background: #fff;
  border: 1px solid var(--line);
  border-radius: 100px;
  padding: 4px 11px;
  font-size: 12px;
  color: var(--text-on-parchment);
}
.chip:hover {
  background: var(--parchment-dim);
}

.chip-empty {
  font-size: 12px;
  color: var(--text-dim);
  font-style: italic;
}

.bio {
  margin-bottom: 18px;
}
.bio-text {
  font-size: 13px;
  white-space: pre-wrap;
  margin: 0 0 8px;
}
.source-text {
  margin: 0;
}

.panel-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.panel-id {
  font-size: 11px;
  opacity: 0.6;
}
</style>
