<template>
  <div>
    <h2>Anagram Finder</h2>
    <label for="word">Word/pattern:</label>
    <input id="word" type="text" v-model="word" />
    <WordListSelector v-model="wordList" />
    <button @click="findAnagrams" :disabled="word.length === 0">
      Find Anagrams
    </button>
    <label>Status messages:</label>
    <pre class="status-messages">{{ status }}</pre>
    <ul v-if="anagrams">
      <li v-for="anagram in anagrams" :key="anagram">
        {{ anagram }}
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
import WordListSelector from "../components/WordListSelector.vue";
import { getAllWords, searchForAnagrams, WordList } from "../shared";
export default {
  name: "Anagram",
  components: {
    WordListSelector,
  },
  data() {
    return {
      anagrams: [] as string[],
      isSearching: false,
      status: "",
      word: "",
      wordList: undefined as WordList | undefined,
    };
  },
  methods: {
    async findAnagrams() {
      if (!this.wordList) {
        // error
        return;
      }
      this.isSearching = true;
      try {
        this.status = "Beginning angram finder...";
        const words = await getAllWords(this.wordList);
        if (words.length === 0) {
          this.status += `\nNo words to check.`;
          return;
        }
        this.status += `\nWord count: ${words.length}`;
        this.anagrams.splice(0, this.anagrams.length);
        await searchForAnagrams({
          pattern: this.word,
          words,
          foundWordCallback: (word) => this.anagrams.push(word),
          statusUpdateCallback: (status) => (this.status += "\n" + status),
        });
      } finally {
        this.isSearching = false;
      }
    },
  },
};
</script>
<style lang="scss" scoped>
.status-messages {
  border: 1px solid gray;
  height: 120px;
  max-height: 120px;
  overflow-y: scroll;
}
</style>
