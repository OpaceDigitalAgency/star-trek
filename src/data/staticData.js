import initialCharacters from './initial-characters.json';
import { PAGE_SIZE, totalCharacters } from './staticCharacters.js';

export const totalPages = Math.ceil(totalCharacters / PAGE_SIZE);
export const staticCharacters = initialCharacters.slice(0, PAGE_SIZE);

export const initialState = {
  characters: staticCharacters,
  totalCharacters,
  totalPages,
  pageSize: PAGE_SIZE
};