<!-- Футер -->

<template>
  <div class="container">
    <div v-for="{label, is_active} in items_count"class="items_count-list">
        <div
        class="items_count__item"
        v-show="is_active"
        >{{ label }}</div>
    </div>
    <FooterSettingsButton>
        <template #icon>
            <img src="../assets/free-icon-settings.png" alt="Иконка Настроек" width="16px" height="16px">
        </template>
    </FooterSettingsButton>

  </div>
  
</template>

<script setup>
import {ref} from 'vue'
import FooterSettingsButton from './FooterSettingsButton.vue';

defineProps({
  // Подсчет персонажей по родословной, состоянию и полу
  count_all_characters: Number,
  count_all_characters_alive: Number,
  count_all_characters_dead: Number,
  count_all_characters_kids: Number,
  count_all_characters_parents: Number,
  count_all_characters_male: Number,
  count_all_characters_female: Number,
  count_all_characters_grandparents: Number,
  // ФИО корневого челика
  root_character_name: String,
});
// Список включаемых настроек
const items_count = ref([
  {
    id: 1,
    label: "Кол-во всех персонажей: ",
    is_active: true
  },
  {
    id: 2,
    label: "Живые: ",
    is_active: false
  },
  {
    id: 3,
    label: "Мёртвые: ",
    is_active: false
  },{
    id: 4,
    label: "Дети: ",
    is_active: false
  },{
    id: 5,
    label: "Родители: ",
    is_active: false
  },{
    id: 6,
    label: "Мужчины: ",
    is_active: false
  },{
    id: 7,
    label: "Женщины: ",
    is_active: false
  },
  {
    id: 8,
    label: "Прародители: ",
    is_active: false
  },
]);
</script>
