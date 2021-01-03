<template>
  <div class="app">
    <Header class="header" />
    <Menu class="menu" />
    <router-view class="content" />
  </div>
</template>

<script>
import Menu from "./components/Menu.vue";
import Header from "./components/Header.vue";

export default {
  name: "App",
  components: {
    Menu,
    Header,
  },
};
</script>

<style lang="scss" scoped>
.app {
  display: grid;
  margin: 0;
  padding: 0;
  grid-template:
    "header header" max-content
    "menu   content" auto
    / 160px auto;
  height: 100vh;

  .header {
    grid-area: header;
    text-align: center;
  }

  .menu {
    grid-area: menu;
    border-right: 1px solid gray;
    border-top: 1px solid gray;
  }

  .content {
    grid-area: content;
    padding: 4px;
  }
}
</style>
