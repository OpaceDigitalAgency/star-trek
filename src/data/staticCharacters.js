import { CHARACTER_PAGE_SIZE } from './constants.js';

export const staticCharacters = [
  {
    uid: "CHMA0000215045",
    name: "James T. Kirk",
    keep: true,
    important: true,
    wikiImage: "/images/kirk-placeholder.jpg"
  },
  {
    uid: "CHMA0000174718",
    name: "Spock",
    keep: true,
    important: true,
    wikiImage: "/images/generic-character.jpg"
  }
];

export const totalCharacters = 7571;
export const totalPages = Math.ceil(totalCharacters / CHARACTER_PAGE_SIZE);