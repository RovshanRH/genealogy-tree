<script setup lang="ts">
import { reactive, ref, watch } from "vue";
import type {
  CreatePersonInput,
  Gender,
  MaritalStatus,
  PersonDetail,
  UpdatePersonInput,
} from "../api/types";

export interface RelativeOption {
  id: string;
  label: string;
}

const props = defineProps<{
  mode: "create" | "edit";
  treeId: string | null;
  initialDetail: PersonDetail | null;
  relativeOptions: RelativeOption[];
  submitting: boolean;
  errorMessage: string | null;
}>();

const emit = defineEmits<{
  submit: [payload: CreatePersonInput | UpdatePersonInput];
  cancel: [];
}>();

interface FormState {
  firstname: string;
  patronymic: string;
  gender: Gender;
  age: string;
  marital_status: MaritalStatus;
  mother_id: string;
  father_id: string;
  spouse_id: string;
  surname_name: string;
  maidensurname_name: string;
  nationality_name: string;
  social_status_name: string;
  social_status_description: string;
  birth_date: string;
  birth_date_approx: boolean;
  birth_country: string;
  birth_city: string;
  reportDeath: boolean;
  death_date: string;
  death_date_approx: boolean;
  death_country: string;
  death_city: string;
  bio: string;
  source_info: string;
  ispersoncontacted: boolean;
}

function emptyForm(): FormState {
  return {
    firstname: "",
    patronymic: "",
    gender: "male",
    age: "",
    marital_status: "single",
    mother_id: "",
    father_id: "",
    spouse_id: "",
    surname_name: "",
    maidensurname_name: "",
    nationality_name: "",
    social_status_name: "",
    social_status_description: "",
    birth_date: "",
    birth_date_approx: false,
    birth_country: "",
    birth_city: "",
    reportDeath: false,
    death_date: "",
    death_date_approx: false,
    death_country: "",
    death_city: "",
    bio: "",
    source_info: "",
    ispersoncontacted: false,
  };
}

const form = reactive<FormState>(emptyForm());

function fillFromDetail(detail: PersonDetail | null) {
  const base = emptyForm();
  if (!detail) {
    Object.assign(form, base);
    return;
  }
  Object.assign(form, {
    ...base,
    firstname: detail.firstname ?? "",
    patronymic: detail.patronymic ?? "",
    gender: detail.gender ?? "male",
    age: detail.age != null ? String(detail.age) : "",
    marital_status: detail.marital_status ?? "single",
    mother_id: detail.mother_obj?.id ?? "",
    father_id: detail.father_obj?.id ?? "",
    spouse_id: detail.spouse_obj?.id ?? "",
    surname_name: detail.surname_obj?.name ?? "",
    maidensurname_name: detail.maidensurname_obj?.name ?? "",
    nationality_name: detail.nationality_obj?.name ?? "",
    social_status_name: detail.social_status_obj?.name ?? "",
    social_status_description: detail.social_status_obj?.description ?? "",
    birth_date: detail.birth_place_obj?.birth_date ?? "",
    birth_date_approx: detail.birth_place_obj?.birth_date_approx ?? false,
    birth_country: detail.birth_place_obj?.country?.name ?? "",
    birth_city: detail.birth_place_obj?.city?.name ?? "",
    reportDeath: detail.isalive === false,
    death_date: detail.death_place_obj?.death_date ?? "",
    death_date_approx: detail.death_place_obj?.death_date_approx ?? false,
    death_country: detail.death_place_obj?.country?.name ?? "",
    death_city: detail.death_place_obj?.city?.name ?? "",
    bio: detail.bio ?? "",
    source_info: detail.source_info ?? "",
    ispersoncontacted: detail.ispersoncontacted ?? false,
  });
}

watch(
  () => props.initialDetail,
  (detail) => fillFromDetail(detail),
  { immediate: true },
);

watch(
  () => props.mode,
  (mode) => {
    if (mode === "create") fillFromDetail(null);
  },
);

const selfId = ref<string | null>(null);
watch(
  () => props.initialDetail,
  (d) => {
    selfId.value = d?.id ?? null;
  },
  { immediate: true },
);

function lookup(name: string) {
  const trimmed = name.trim();
  return trimmed ? { name: trimmed } : null;
}

function buildPayload(): CreatePersonInput | UpdatePersonInput {
  const birthPlace =
    form.birth_date || form.birth_country || form.birth_city
      ? {
          birth_date: form.birth_date || null,
          birth_date_approx: form.birth_date_approx,
          country: lookup(form.birth_country),
          city: lookup(form.birth_city),
        }
      : null;

  const deathPlace = form.reportDeath
    ? {
        death_date: form.death_date || null,
        death_date_approx: form.death_date_approx,
        country: lookup(form.death_country),
        city: lookup(form.death_city),
      }
    : null;

  const common = {
    firstname: form.firstname.trim(),
    patronymic: form.patronymic.trim() || null,
    gender: form.gender,
    age: form.age ? Number(form.age) : null,
    marital_status: form.marital_status,
    mother_id: form.mother_id || null,
    father_id: form.father_id || null,
    spouse_id: form.spouse_id || null,
    surname: lookup(form.surname_name),
    maidensurname: lookup(form.maidensurname_name),
    nationality: lookup(form.nationality_name),
    social_status: form.social_status_name.trim()
      ? {
          name: form.social_status_name.trim(),
          description: form.social_status_description.trim() || null,
        }
      : null,
    birth_place: birthPlace,
    death_place: deathPlace,
    bio: form.bio.trim() || null,
    source_info: form.source_info.trim() || null,
    ispersoncontacted: form.ispersoncontacted,
  };

  if (props.mode === "create") {
    return {
      ...common,
      genealogy_tree_id: props.treeId as string,
    } as CreatePersonInput;
  }
  return common as UpdatePersonInput;
}

function handleSubmit() {
  if (!form.firstname.trim()) return;
  emit("submit", buildPayload());
}

function availableRelatives(excludeSelfFromSpouse = false) {
  return props.relativeOptions.filter((r) => r.id !== selfId.value);
}
</script>

<template>
  <div class="overlay" @click.self="emit('cancel')">
    <form class="form-card" @submit.prevent="handleSubmit">
      <h2 class="form-title">
        {{ mode === "create" ? "Новый человек" : "Редактирование" }}
      </h2>

      <div v-if="errorMessage" class="error-banner">{{ errorMessage }}</div>

      <fieldset class="fieldset">
        <legend>Основное</legend>
        <div class="field-row">
          <div class="field">
            <label>Имя *</label>
            <input v-model="form.firstname" type="text" required />
          </div>
          <div class="field">
            <label>Отчество</label>
            <input v-model="form.patronymic" type="text" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Фамилия</label>
            <input v-model="form.surname_name" type="text" />
          </div>
          <div class="field">
            <label>Девичья фамилия</label>
            <input v-model="form.maidensurname_name" type="text" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Пол</label>
            <select v-model="form.gender">
              <option value="male">мужской</option>
              <option value="female">женский</option>
            </select>
          </div>
          <div class="field">
            <label>Возраст</label>
            <input v-model="form.age" type="number" min="0" />
          </div>
          <div class="field">
            <label>Семейное положение</label>
            <select v-model="form.marital_status">
              <option value="single">не состоит в браке</option>
              <option value="married">в браке</option>
              <option value="divorced">в разводе</option>
              <option value="widowed">вдовец/вдова</option>
            </select>
          </div>
        </div>
      </fieldset>

      <fieldset class="fieldset">
        <legend>Родственные связи</legend>
        <div class="field-row">
          <div class="field">
            <label>Отец</label>
            <select v-model="form.father_id">
              <option value="">— не указан —</option>
              <option
                v-for="opt in availableRelatives()"
                :key="opt.id"
                :value="opt.id"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>
          <div class="field">
            <label>Мать</label>
            <select v-model="form.mother_id">
              <option value="">— не указана —</option>
              <option
                v-for="opt in availableRelatives()"
                :key="opt.id"
                :value="opt.id"
              >
                {{ opt.label }}
              </option>
            </select>
          </div>
        </div>
        <div class="field">
          <label>Супруг(а)</label>
          <select v-model="form.spouse_id">
            <option value="">— не указан(а) —</option>
            <option
              v-for="opt in availableRelatives()"
              :key="opt.id"
              :value="opt.id"
            >
              {{ opt.label }}
            </option>
          </select>
        </div>
        <p class="hint-text">
          Семейное положение «в браке»/«вдовец(а)» требует указанного супруга;
          «не состоит в браке»/«в разводе» — наоборот.
        </p>
      </fieldset>

      <fieldset class="fieldset">
        <legend>Происхождение</legend>
        <div class="field-row">
          <div class="field">
            <label>Национальность</label>
            <input v-model="form.nationality_name" type="text" />
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Соц. статус</label>
            <input v-model="form.social_status_name" type="text" />
          </div>
          <div class="field">
            <label>Описание статуса</label>
            <input v-model="form.social_status_description" type="text" />
          </div>
        </div>
      </fieldset>

      <fieldset class="fieldset">
        <legend>Место и дата рождения</legend>
        <div class="field-row">
          <div class="field">
            <label>Дата рождения</label>
            <input v-model="form.birth_date" type="date" />
          </div>
          <div class="field-check">
            <input
              id="birth-approx"
              v-model="form.birth_date_approx"
              type="checkbox"
            />
            <label for="birth-approx">дата приблизительная</label>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label>Страна рождения</label>
            <input v-model="form.birth_country" type="text" />
          </div>
          <div class="field">
            <label>Город рождения</label>
            <input v-model="form.birth_city" type="text" />
          </div>
        </div>
      </fieldset>

      <fieldset class="fieldset">
        <legend>Смерть</legend>
        <div class="field-check">
          <input id="report-death" v-model="form.reportDeath" type="checkbox" />
          <label for="report-death">человек умер(ла)</label>
        </div>
        <template v-if="form.reportDeath">
          <div class="field-row">
            <div class="field">
              <label>Дата смерти</label>
              <input v-model="form.death_date" type="date" />
            </div>
            <div class="field-check">
              <input
                id="death-approx"
                v-model="form.death_date_approx"
                type="checkbox"
              />
              <label for="death-approx">дата приблизительная</label>
            </div>
          </div>
          <div class="field-row">
            <div class="field">
              <label>Страна смерти</label>
              <input v-model="form.death_country" type="text" />
            </div>
            <div class="field">
              <label>Город смерти</label>
              <input v-model="form.death_city" type="text" />
            </div>
          </div>
        </template>
        <p class="hint-text">
          Статус «жив(а)/умер(ла)» сервер выставит автоматически по наличию
          места смерти.
        </p>
      </fieldset>

      <fieldset class="fieldset">
        <legend>Биография и источники</legend>
        <div class="field">
          <label>Биография</label>
          <textarea v-model="form.bio" rows="3" />
        </div>
        <div class="field">
          <label>Источник информации</label>
          <input v-model="form.source_info" type="text" />
        </div>
        <div class="field-check">
          <input
            id="contacted"
            v-model="form.ispersoncontacted"
            type="checkbox"
          />
          <label for="contacted">был установлен контакт с человеком</label>
        </div>
      </fieldset>

      <div class="form-actions">
        <button
          type="submit"
          class="btn btn-primary"
          :disabled="submitting || !form.firstname.trim()"
        >
          {{ submitting ? "Сохранение…" : "Сохранить" }}
        </button>
        <button
          type="button"
          class="btn btn-ghost"
          :disabled="submitting"
          @click="emit('cancel')"
        >
          Отмена
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(22, 36, 46, 0.65);
  display: flex;
  justify-content: flex-end;
  z-index: 50;
}

.form-card {
  width: 420px;
  max-width: 92vw;
  height: 100%;
  background: var(--parchment);
  color: var(--text-on-parchment);
  padding: 22px 22px 30px;
  overflow-y: auto;
  box-shadow: -8px 0 30px rgba(0, 0, 0, 0.35);
}

.form-title {
  font-size: 20px;
  margin-bottom: 16px;
}

.hint-text {
  font-size: 11px;
  color: var(--text-dim);
  margin: 0 0 8px;
}

textarea {
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 7px 9px;
  background: #fff;
  color: var(--text-on-parchment);
  resize: vertical;
  font-family: var(--font-body);
}

.form-actions {
  display: flex;
  gap: 10px;
  position: sticky;
  bottom: 0;
  background: var(--parchment);
  padding-top: 10px;
}
</style>
