<template>
  <div>
    <label for="wordList"> Word List: </label>
    <select id="wordList" v-model="wordList">
      <option
        v-for="list in wordLists"
        :key="list.name"
        :selected="wordList.name === list.name"
      >
        {{ list.name }}
      </option>
      <option>Custom</option>
    </select>
    <p v-if="wordList === 'Custom'">
      <label for="customWordList">Custom Word List:</label>
      <textarea
        id="customWordList"
        v-model="customWordList"
        rows="8"
        cols="120"
      ></textarea>
      OR
      <label for="customWordUrl">URL for Words:</label>
      <input type="text" v-model="customWordUrl" />
    </p>
  </div>
</template>

<script lang="ts">
import { WordList, WORD_LISTS } from "../shared";
export default {
  name: "WordListSelector",
  props: ["modelValue"],
  emits: ["update:modelValue"],
  setup(context, props) {},
  data() {
    return {
      wordLists: WORD_LISTS,
      wordList: WORD_LISTS[0].name,
      customWordUrl: "",
      customWordList: "",
    };
  },
  watch: {
    customWordList() {
      this.emitWordList();
    },
    customWordUrl() {
      this.emitWordList();
    },
    wordList: {
      handler() {
        this.emitWordList();
      },
      immediate: true,
    },
  },
  methods: {
    emitWordList() {
      let wordList: WordList | undefined;
      if (this.wordList === "Custom") {
        wordList = {
          name: "Custom",
          sourceUrl: this.customWordUrl,
          words: this.customWordList.length
            ? this.customWordList.split(/\s+/)
            : undefined,
        };
      } else if (this.wordList) {
        wordList = this.wordLists.find(({ name }) => this.wordList === name);
      }
      this.$emit("update:modelValue", wordList);
    },
  },
};
</script>
