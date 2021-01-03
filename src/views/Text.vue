<template>
  <div>
    <h2>Text Transformation</h2>

    <label for="input-text" class="input-text-label">Input:</label>
    <textarea
      id="input-text"
      class="input-text"
      v-model="input"
      placeholder="Input text"
      rows="10"
      cols="120"
    >
    </textarea>
    <p>
      <input type="checkbox" v-model="updateAsTyped" id="updateAsTyped" />
      <label for="updateAsTyped">Update as you type</label>
      <button :disabled="updateAsTyped" @click="runTransformers">
        Transform Now
      </button>
    </p>
    <section>
      Transformations:
      <ul class="transformers">
        <li v-for="transformer in transformers" :key="transformer.name">
          {{ transformer.name }}
          <button
            v-if="!transformer.isFactory"
            @click="
              newTransformerName = transformer.name;
              addTransformer();
            "
          >
            Add
          </button>
          <button v-else @click="newTransformerName = transformer.name">
            Configure
          </button>
          <ul v-if="newTransformerName === transformer.name">
            <li
              v-for="[name, type] in Object.entries(transformer.options)"
              :key="name"
            >
              {{ name }}:
              <input :type="type" v-model="newTransformerOptions[name]" />
            </li>
            <button @click="addTransformer">Add</button>
          </ul>
        </li>
      </ul>
      <ul class="transformations">
        <li v-for="(t, tIndex) in transformations" :key="tIndex">
          {{ t.name }}
        </li>
        <li v-if="transformations.length === 0">
          No transformations selected.
        </li>
      </ul>
    </section>
    <label for="output-text" class="output-text-label">Output:</label>
    <textarea
      class="output-text"
      v-model="output"
      placeholder="Output text"
      rows="10"
      cols="120"
    >
    </textarea>
  </div>
</template>

<script lang="ts">
import { transformVNodeArgs } from "vue";
function isLetter(c: string) {
  return c.toLowerCase() !== c.toUpperCase(); // good enough for ASCII
}

type PHTransformerType = "character" | "full";

interface PHTransformer {
  name: string;
  type: PHTransformerType;
}

interface PHTransformerFactory<T extends PHTransformer> {
  name: string;
  isFactory: true;
  options: Record<string, "text" | "number">;
  createTransformer(options: Record<string, string | number>): T;
}

interface CharacterTransformationContext {
  character: string;
}

interface CharacterTransformer extends PHTransformer {
  type: "character";
  transform(context: CharacterTransformationContext): string;
}

interface FullTextTransformer extends PHTransformer {
  type: "full";
  transform(text: string): string;
}

class BasePHTransformer implements PHTransformer {
  name: string;
  type: PHTransformerType;
  constructor(name: string) {
    this.name = name;
  }
}

const uppercaseTransformer: CharacterTransformer = {
  name: "Uppercase",
  type: "character",

  transform(context) {
    return context.character.toUpperCase();
  },
};

const lowercaseTransformer: CharacterTransformer = {
  name: "Lowercase",
  type: "character",
  transform(context) {
    return context.character.toLowerCase();
  },
};

const removeAllSpacesTransformer: CharacterTransformer = {
  name: "Remove all spaces",
  type: "character",
  transform(context) {
    return context.character.match(/\s/) ? "" : context.character;
  },
};

class RotNTransformer
  extends BasePHTransformer
  implements CharacterTransformer {
  type: "character";
  n: number;

  constructor(options: { n: number }) {
    super(`Rot ${options.n}`);
    this.n = options.n;
  }

  transform(context) {
    if (isLetter(context.character)) {
      let index = context.character.charCodeAt(0) + Number(this.n);
      if (context.character === context.character.toLowerCase()) {
        while (index > "z".charCodeAt(0)) {
          index -= 26; // can do this smarter no doubt
        }
      } else {
        while (index > "Z".charCodeAt(0)) {
          index -= 26;
        }
      }
      return String.fromCharCode(index);
    } else {
      return context.character;
    }
  }
}

const RotNTransformerFactory: PHTransformerFactory<RotNTransformer> = {
  name: "Rot N",
  isFactory: true,
  options: { n: "number" },
  createTransformer(options: { n: number }) {
    return new RotNTransformer(options);
  },
};

class GridTransformer extends BasePHTransformer implements FullTextTransformer {
  type: "full";
  width: number;

  constructor(options: { width: number }) {
    super(`Grid (${options.width} x N)`);
    this.width = options.width;
    this.type = "full";
  }

  transform(text) {
    const temp =
      text.split(/\s+/g).reduce(
        ({ grid, w }, word) => {
          if (grid.length === 0) {
            return { grid: word, w: 1 };
          } else if (w >= this.width) {
            return { grid: grid + "\n" + word, w: 1 };
          } else {
            return { grid: grid + " " + word, w: w + 1 };
          }
        },
        { grid: "", w: 0 }
      ).grid + "\n";
    return temp;
  }
}
const gridTransformerFactory: PHTransformerFactory<GridTransformer> = {
  name: "Turn space-delimited text into a Grid",
  isFactory: true,
  options: { width: "number" },
  createTransformer(options: { width: number }) {
    return new GridTransformer(options);
  },
};
export default {
  name: "Text",
  data() {
    return {
      input: "",
      output: "",
      updateAsTyped: false,
      newTransformerName: "",
      newTransformerOptions: {} as Record<string, string | number>,
      transformers: {
        RotNTransformerFactory,
        uppercaseTransformer,
        lowercaseTransformer,
        removeAllSpacesTransformer,
        gridTransformerFactory,
      } as Record<string, PHTransformer | PHTransformerFactory<any>>,
      transformations: [] as PHTransformer[],
    };
  },
  watch: {
    input() {
      if (this.updateAsTyped) {
        this.runTransformers();
      }
    },
  },
  methods: {
    addTransformer() {
      const tOrTf = Object.entries(this.transformers).find(
        ([, t]) =>
          (t as PHTransformer | PHTransformerFactory<any>).name ===
          this.newTransformerName
      );
      if (!tOrTf) {
        console.log(`Couldn't find ${this.newTransformerName}`);
        return;
      }
      let transformer: PHTransformer;
      if ((tOrTf[1] as PHTransformerFactory<any>).isFactory) {
        transformer = (tOrTf[1] as PHTransformerFactory<any>).createTransformer(
          this.newTransformerOptions
        );
      } else {
        transformer = tOrTf[1] as PHTransformer;
        console.log("Found it");
      }

      this.transformations.push(transformer);
      this.newTransformerName = "";
      this.newTransformerOptions = {};
    },
    runTransformers() {
      this.output = this.transformations.reduce(
        (text: string, transformer: PHTransformer) => {
          console.log(transformer);
          if (transformer.type === "character") {
            const context: CharacterTransformationContext = {
              character: "",
            };
            let buffer = "";
            for (let i = 0; i < text.length; i++) {
              context.character = text.charAt(i);
              buffer += (transformer as CharacterTransformer).transform(
                context
              );
            }
            return buffer;
          } else if (transformer.type === "full") {
            console.log("We have a transformer!", transformer);
            return (transformer as FullTextTransformer).transform(text);
          }
        },
        this.input
      );
    },
  },
};
</script>

<style lang="scss" scoped>
.input-text-label,
.output-text-label {
  font-size: 20px;
  display: block;
}

.transformations {
  padding: 0;
  list-style: none;
  border: 1px solid gray;
}
</style>
