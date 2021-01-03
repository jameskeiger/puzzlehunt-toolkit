import { isElementAccessChain } from "typescript";

export interface SearchableDictionary {
  containsRoot(text: string): boolean;
  containsWord(word: string): boolean;
}

export class ArrayDictionary implements SearchableDictionary {
  array: string[];
  constructor(array: string[]) {
    this.array = array;
  }

  containsRoot(text: string) {
    return this.array.some((w) => w.startsWith(text));
  }

  containsWord(text: string) {
    return this.array.includes(text);
  }
}

export interface WordList {
  name: string;
  sourceUrl?: string;
  words?: string[];
}

export const ENGLISH_WORDS: WordList = {
  name: "English",
  sourceUrl:
    "https://github.com/dwyl/english-words/blob/master/words_alpha.txt",
};

export const WORD_LISTS = [ENGLISH_WORDS];

/**
 * Is this pattern an anagram of this word?
 * @param pattern the pattern to test
 * @param word the word it might be an anagram of.
 */
function isAnagram(pattern: string, word: string): boolean {
  if (pattern.length !== word.length) {
    return false;
  }
  // Basic words (TODO: wildcards, etc.)
  const ws = word.split("").sort();
  return pattern
    .split("")
    .sort()
    .every((letter, index) => ws[index] === letter);
}

export async function searchForAnagrams({
  pattern,
  words,
  foundWordCallback,
  statusUpdateCallback,
}: {
  pattern: string;
  words: string[];
  foundWordCallback: (word: string) => void;
  statusUpdateCallback: (status: string) => void;
}): Promise<void> {
  const updatePercentEvery = Math.round(words.length / 100);
  // naively search for anagrams
  for (let i = 0; i < words.length; i++) {
    if (isAnagram(pattern, words[i])) {
      foundWordCallback(words[i]);
    }
    if (i > 0 && i % updatePercentEvery === 0) {
      statusUpdateCallback(`${Math.round(i / words.length)}%`);
    }
  }
}

export async function getAllWords(wordList: WordList): Promise<string[]> {
  if (wordList.words?.length) {
    return wordList.words;
  } else if (wordList.sourceUrl) {
    const response = await fetch(wordList.sourceUrl);
    console.log(response);
    return [];
  } else {
    return [];
  }
}
