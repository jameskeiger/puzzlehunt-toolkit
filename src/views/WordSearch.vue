<template>
  <div>
    <h2>Word Search</h2>

    <section>
      Puzzle:
      <textarea v-model="puzzle" rows="10" cols="120"> </textarea>
      Dictionary
      <select v-model="dictionary">
        <option v-for="option in dictionaries" :key="option">
          {{ option }}
        </option>
      </select>
      Min length: <input type="number" v-model="minLength" />
      <button @click="render">Test</button>
      <button @click="search">Search</button>
    </section>
    <canvas ref="canvas" class="output-canvas"> </canvas>
    <ul>
      <li v-for="(word, windex) in foundWords" :key="windex">
        {{ word.word }} ({{ word.x }}, {{ word.y }} - {{ word.direction }})
      </li>
    </ul>
  </div>
</template>

<script lang="ts">
const CANVAS_START_X = 20;
const CANVAS_START_Y = 20;
const CANVAS_DX = 20;
const CANVAS_DY = 20;

const sample = `A P P L E Z
 Z E E Z Z Z
 Z A Z A Z Z
 Z R Z Z C Z
 Z Z Z Z Z H`;

interface Searcher {
  containsRoot(text: string): boolean;
  containsWord(word: string): boolean;
}

class ArraySearcher implements Searcher {
  array: string[];
  constructor(array: string[]) {
    this.array = array;
  }

  containsRoot(text) {
    return this.array.some((w) => w.startsWith(text));
  }

  containsWord(text) {
    return this.array.includes(text);
  }
}

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
  W: {
    dx: 0,
    dy: -1,
    angle: Math.PI,
  },
  SW: {
    dx: 1,
    dy: -1,
    angle: (5 * Math.PI) / 4,
  },
  S: {
    dx: 1,
    dy: 0,
    angle: (3 * Math.PI) / 2,
  },
  SE: {
    dx: 1,
    dy: 1,
    angle: (7 * Math.PI) / 4,
  },
  E: {
    dx: 0,
    dy: 1,
    angle: 0,
  },
  NE: {
    dx: -1,
    dy: 1,
    angle: Math.PI / 4,
  },
  N: {
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
  data() {
    return {
      dictionary: "US-English",
      dictionaries: ["US-English", "Custom"],
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
      const canvas = this.$refs.canvas as HTMLCanvasElement;
      const ctx = canvas.getContext("2d");
      ctx.font = "20px Courier";
      let x = CANVAS_START_X;
      let y = CANVAS_START_Y;
      this.puzzle.split("\n").forEach((line) => {
        line.split(/\s+/).forEach((letter) => {
          ctx.fillText(letter, x, y);
          x += CANVAS_DX;
        });
        y += CANVAS_DY;
        x = CANVAS_START_X;
      });
      this.foundWords.forEach((word) => {
        // draw the half-circle at the end
        ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
        const dir = directions[word.direction];
        //  const startAngle = dir.angle + (3 * Math.PI) / 4;
        let sx = word.y * CANVAS_DX + CANVAS_START_X - CANVAS_DX;
        let sy = word.x * CANVAS_DY + CANVAS_START_Y;
        for (let c = 0; c < word.word.length; c++) {
          ctx.fillRect(sy, sx, CANVAS_DY, CANVAS_DX);
          sx += dir.dx * CANVAS_DX;
          sy += dir.dy * CANVAS_DY;
        }
      });
    },
    search() {
      const src = new ArraySearcher(["APPLE", "PEAR"]);
      const grid = this.getGrid();
      const words: FoundWord[] = [];
      for (let x = 0; x < grid.length; x++) {
        for (let y = 0; y < grid[x].length; y++) {
          Object.entries(directions).map(([direction, { dx, dy }]) => {
            let nx = x;
            let ny = y;
            let word = "";
            while (
              src.containsRoot(word) &&
              nx < grid.length &&
              nx >= 0 &&
              ny < grid[nx].length &&
              ny >= 0
            ) {
              word += grid[nx][ny];
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

<style lang="scss" scoped>
.output-canvas {
  height: 400px;
  width: 400px;
  border: 1px solid gray;
}
</style>
