<template>
  <div>
    <h2>Word Search</h2>

    <section>
      Puzzle:
      <textarea v-model="puzzle" rows="10" cols="120"> </textarea>
      <WordListSelector v-model="wordList" />
      Min length: <input type="number" v-model="minLength" />
      <button @click="render">Test</button>
      <button @click="search">Search</button>
    </section>
    <p class="output">
    <svg xmlns="http://www.w3.org/2000/svg" ref="svg" class="output-svg" />
    <ol class="anagrams-list">
      <li v-for="(word, windex) in foundWords" :key="windex" :class="`found-word--${windex % 10}`">
        {{ word.word }} ({{ word.x }}, {{ word.y }} - {{ word.direction }})
      </li>
    </ol>
    </p>
  </div>
</template>

<script lang="ts">
import { ArrayDictionary, getAllWords, WordList } from "../shared";
import { createSvgElement } from "../svg";
import WordListSelector from "../components/WordListSelector.vue";
const CANVAS_START_X = 20;
const CANVAS_START_Y = 20;
const CANVAS_DX = 20;
const CANVAS_DY = 22;
const LETTER_WIDTH = 12;
const LETTER_HEIGHT = 16;
const PADDING_X = 3;
const PADDING_Y = 3;

const sample = `A P P L E Z
 Z E E Z Z Z
 Z A Z A Z Z
 Z R Z Z C Z
 Z Z Z Z Z H`;

type DirectionKey = "N" | "NE" | "E" | "SE" | "S" | "SW" | "W" | "NW";

interface FoundWord {
  word: string;
  x: number;
  y: number;
  direction: DirectionKey;
}

interface DirectionIterator {
  dx: number;
  dy: number;
  angle: number;
}

const directions: Record<DirectionKey, DirectionIterator> = {
  N: {
    dx: 0,
    dy: -1,
    angle: Math.PI,
  },
  NE: {
    dx: 1,
    dy: -1,
    angle: (5 * Math.PI) / 4,
  },
  E: {
    dx: 1,
    dy: 0,
    angle: (3 * Math.PI) / 2,
  },
  SE: {
    dx: 1,
    dy: 1,
    angle: (7 * Math.PI) / 4,
  },
  S: {
    dx: 0,
    dy: 1,
    angle: 0,
  },
  SW: {
    dx: -1,
    dy: 1,
    angle: Math.PI / 4,
  },
  W: {
    dx: -1,
    dy: 0,
    angle: Math.PI / 2,
  },
  NW: {
    dx: -1,
    dy: -1,
    angle: (3 * Math.PI) / 4,
  },
};

export default {
  name: "WordSearch",
  components: {
    WordListSelector,
  },
  data() {
    return {
      wordList: undefined as undefined | WordList,
      minLength: 3,
      foundWords: [] as FoundWord[],
      puzzle: sample
        .split("\n")
        .map((t) => t.trim())
        .join("\n"),
    };
  },
  methods: {
    getGrid(): string[][] {
      return this.puzzle.split("\n").map((line) => line.split(/\s+/));
    },
    render() {
      const svg = this.$refs.svg as SVGElement;
      svg.innerHTML = "";
      let x = CANVAS_START_X;
      let y = CANVAS_START_Y;
      this.puzzle.split("\n").forEach((line) => {
        line.split(/\s+/).forEach((letter) => {
          svg.appendChild(createSvgElement("text", { x, y }, letter));
          x += CANVAS_DX;
        });
        y += CANVAS_DY;
        x = CANVAS_START_X;
      });

      this.foundWords.forEach((word, index) => {
        let sx = CANVAS_START_X + word.x * CANVAS_DX - PADDING_X;
        let sy = CANVAS_START_Y + (word.y - 1) * CANVAS_DY + (LETTER_HEIGHT - PADDING_Y) / 2;
        const dir = directions[word.direction];
        word.word.split("").forEach((letter) => {
          svg.appendChild(
            createSvgElement("rect", {
              x: sx,
              y: sy,
              width: LETTER_WIDTH + PADDING_X * 2,
              height: LETTER_HEIGHT + PADDING_Y * 2,
              class: `found-word--${index}`,
              rx: 4,
            })
          );
          sx += dir.dx * CANVAS_DX;
          sy += dir.dy * CANVAS_DY;
        });
      });

    },
    async search() {
      const allWords = await getAllWords(this.wordList);
      const src = new ArrayDictionary(allWords);
      const grid = this.getGrid();
      const words: FoundWord[] = [];
      for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
          Object.entries(directions).map(([direction, { dx, dy }]) => {
            let nx = x;
            let ny = y;
            let word = "";
            while (
              src.containsRoot(word) &&
              ny < grid.length &&
              ny >= 0 &&
              nx < grid[ny].length &&
              nx >= 0
            ) {
              word += grid[ny][nx];
              if (src.containsWord(word)) {
                words.push({
                  word,
                  x,
                  y,
                  direction: direction as DirectionKey,
                });
              }
              nx += dx;
              ny += dy;
            }
          });
        }
      }
      this.foundWords = words;
      this.render();
    },
  },
};
</script>

<style lang="scss">
.output {
  display: grid;
  grid: 'svg anagrams'
    / 400px 1fr;
}
.output-svg {
  grid-area: svg;
  height: 400px;
  width: 400px;
  border: 1px solid gray;
}

.anagrams-list {
  grid-area: anagrams;
  text-align: left;
  font-family: 'Courier New', Courier, monospace;

  li {
    padding: 2px;
    cursor: pointer;
  }

  li:hover {
    text-decoration: underline;
  }
}

.found-word--0 {
  background-color: rgba(255, 0, 0, 0.2);
  fill: rgba(255, 0, 0, 0.2);
}

.found-word--1 {
  background-color: rgba(0, 255, 0, 0.2);
  fill: rgba(0, 255, 0, 0.2);
}

.found-word--2 {
  background-color: rgba(0, 0, 255, 0.2);
  fill: rgba(0, 0, 255, 0.2);
}

.found-word--3 {
  background-color: rgba(255, 255, 0, 0.2);
  fill: rgba(255, 255, 0, 0.2);
}

text {
  font-family: "Courier New", Courier, monospace;
  font-size: 20px;
  stroke: black;
}
</style>
