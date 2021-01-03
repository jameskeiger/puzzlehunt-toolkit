import { createWebHistory, createRouter } from "vue-router";
import Home from "./views/Home.vue";
import Text from "./views/Text.vue";
import Anagram from "./views/Anagram.vue";
import WordSearch from "./views/WordSearch.vue";

const routes = [
  {
    path: "/",
    name: "Home",
    component: Home,
  },
  {
    path: "/text",
    name: "Text",
    component: Text,
  },
  {
    path: "/anagram",
    name: "Anagram",
    component: Anagram,
  },
  {
    path: "/wordsearch",
    name: "WordSearch",
    component: WordSearch,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
