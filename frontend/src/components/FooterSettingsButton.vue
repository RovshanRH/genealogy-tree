<!-- Кнопка настроек в футере -->

<template>
  <button class="with-icon-btn" @click="$emit('clicked')">
    <slot name="icon"></slot>
    <span>{{ label }}</span>
  </button>
</template>

<script>
export default {
    props: {
        label: String
    }
}
</script>
