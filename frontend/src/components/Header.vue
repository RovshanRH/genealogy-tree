<!-- Шапка в мэйне -->

<template>
    <div class="container">
        <h1>
            {{ app_name }}
        </h1>
        <span>
            Фамильное дерево: {{ family_tree_name }}
        </span>
    </div>
</template>

<script setup>
defineProps({
    app_name: String,   
    family_tree_name: String
})
</script>