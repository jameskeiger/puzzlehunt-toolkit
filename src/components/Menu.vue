<template>
  <div>
    <ul class="menu-list">
      <li v-for="(option, index) in menuOptions" :key="index">
        <router-link :to="option.route">{{ option.name }}</router-link>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "Menu",
  data() {
    return {
      menuOptions: [
        { name: "Text Transformation", route: "/text" },
        { name: "Anagram Finder", route: "/anagram" },
        { name: "Word Search", route: "/wordsearch" },
      ],
    };
  },
};
</script>

<style lang="scss" scoped>
.menu-list {
  padding: 0;
  list-style: none;
}
</style>
