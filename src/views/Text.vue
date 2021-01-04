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
      <button :disabled="updateAsTyped" @click="runTransformers">
        Transform Now
      </button>
      <input
        class="update-as-you-type-checkbox"
        type="checkbox"
        v-model="updateAsTyped"
        id="updateAsTyped"
      />
      <label for="updateAsTyped">Update as you type</label>
    </p>
    <section>
      Transformations (click to configure/add):
      <ul class="transformers">
        <li v-for="transformer in transformers" :key="transformer.name">
          <a @click="startAddTransformer(transformer)" class="transformer-name">
            {{ transformer.name }}
          </a>
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
          <a @click.stop="deleteTransformer(tIndex)" class="delete-button"
            >[X]</a
          >
        </li>
        <li v-if="transformations.length === 0">No transformations.</li>
        <button
          v-else
          @click="transformations.splice(0, transformations.length)"
        >
          Clear all
        </button>
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
    <button @click="input = output">Copy into Input</button>
  </div>
</template>

<script lang="ts">
import { transformVNodeArgs } from "vue";
import { transform } from "typescript";
function isLetter(c: string) {
  return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(c.toUpperCase()) !== -1;
}

type PHTransformerType = "character" | "full" | "word";

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
  indexInText: number;
}

interface CharacterTransformer extends PHTransformer {
  type: "character";
  transform(context: CharacterTransformationContext): string;
}

interface WordTransformer extends PHTransformer {
  type: "word";
  transform(word: string): string;
}

interface FullTextTransformer extends PHTransformer {
  type: "full";
  transform(text: string): string;
}

class BasePHTransformer implements PHTransformer {
  name: string;
  type: PHTransformerType;
  constructor(type: PHTransformerType, name: string) {
    this.type = type;
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

const numberToLetterTransformer: WordTransformer = {
  name: "Numbers to Letters",
  type: "word",
  transform(word) {
    const n = Number(word);
    if (isFinite(n)) {
      return "ABCDEFGHIJKLMNOPQRSTUVWXYZ".charAt((n % 26) - 1);
    } else {
      return word;
    }
  },
};

const letterToNumberTransformer: CharacterTransformer = {
  name: "Letters to Numbers",
  type: "character",
  transform(context) {
    if (isLetter(context.character)) {
      return (
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ".indexOf(context.character.toUpperCase()) +
        1 +
        " "
      );
    } else {
      return context.character;
    }
  },
};

class RotNTransformer
  extends BasePHTransformer
  implements CharacterTransformer {
  type: "character";
  n: number;

  constructor(options: { n: number }) {
    super("character", `Rot ${options.n}`);
    this.n = options.n;
  }

  transform(context: CharacterTransformationContext) {
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
    super("full", `Grid (${options.width} x N)`);
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

class InsertXEveryYTransformer
  extends BasePHTransformer
  implements CharacterTransformer {
  type: "character";
  n: number;
  text: string;

  constructor(options: { n: number; text: string }) {
    super(
      "character",
      `Insert "${options.text}" after every ${options.n} characters`
    );
    this.n = options.n;
    this.text = options.text;
  }

  transform(context: CharacterTransformationContext) {
    if ((context.indexInText + 1) % this.n === 0) {
      return context.character + this.text;
    } else {
      return context.character;
    }
  }
}

const insertXEveryYFactory: PHTransformerFactory<InsertXEveryYTransformer> = {
  name: "Insert text after every N characters ",
  isFactory: true,
  options: { text: "text", n: "number" },
  createTransformer(options: { n: number; text: string }) {
    return new InsertXEveryYTransformer(options);
  },
};

class FunctionTransformer extends BasePHTransformer implements WordTransformer {
  type: "word";
  formula: string;

  constructor(options: { formula: string }) {
    super("word", `Apply "${options.formula}" to each value`);
    this.formula = options.formula;
  }

  transform(word: string) {
    const num = Number(word);
    if (isFinite(num)) {
      return eval(`x = ${num}; ${this.formula}`);
    } else {
      return eval(`x = ${word}; ${this.formula}`) ?? word;
    }
  }
}

const functionTransformerFactory: PHTransformerFactory<FunctionTransformer> = {
  name: "Apply a formula to each number (e.g., 'x + 2')",
  isFactory: true,
  options: { formula: "text" },
  createTransformer(options: { formula: string }) {
    return new FunctionTransformer(options);
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
        numberToLetterTransformer,
        letterToNumberTransformer,
        insertXEveryYFactory,
        functionTransformerFactory,
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
    startAddTransformer(t: PHTransformer | PHTransformerFactory<any>) {
      this.newTransformerName = t.name;
      if (!(t as PHTransformerFactory<any>).isFactory) {
        this.addTransformer();
      }
    },
    deleteTransformer(index: number) {
      this.transformations.splice(index, 1);
    },
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
      }

      this.transformations.push(transformer);
      this.newTransformerName = "";
      this.newTransformerOptions = {};
      this.runTransformers();
    },
    runTransformers() {
      this.output = this.transformations.reduce(
        (text: string, transformer: PHTransformer) => {
          switch (transformer.type) {
            case "character":
              let buffer = "";
              for (let i = 0; i < text.length; i++) {
                buffer += (transformer as CharacterTransformer).transform({
                  character: text.charAt(i),
                  indexInText: i,
                });
              }
              return buffer;
            case "full":
              return (transformer as FullTextTransformer).transform(text);
            case "word":
              return text
                .split("\n")
                .map((line) =>
                  line
                    .split(/\s+/)
                    .map((word) =>
                      (transformer as WordTransformer).transform(word)
                    )
                    .join(" ")
                )
                .join("\n");
            default:
              throw new Error("invalid type:" + transformer.type);
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

.update-as-you-type-checkbox {
  margin-left: 12px;
}

.transformations {
  padding: 8px;
  list-style: none;
  border: 1px solid gray;
}

.delete-button {
  font-size: 10px;
  cursor: pointer;
}

.delete-button:hover {
  text-decoration: underline;
  color: blue;
}

.transformers {
  li {
    padding: 2px;
  }

  .transformer-name {
    cursor: pointer;
    &:hover {
      color: blue;
    }
  }
}
</style>
