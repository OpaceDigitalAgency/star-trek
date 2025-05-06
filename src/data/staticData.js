import initialCharacters from './initial-characters.json';
import { CHARACTER_PAGE_SIZE } from './constants.js';
import { totalCharacters as _totalCharacters } from './staticCharacters.js';

export const totalCharacters = _totalCharacters;
export const totalPages = Math.ceil(totalCharacters / CHARACTER_PAGE_SIZE);
export const staticCharacters = initialCharacters.slice(0, CHARACTER_PAGE_SIZE);

export const initialState = {
  characters: staticCharacters,
  totalCharacters,
  totalPages,
  pageSize: CHARACTER_PAGE_SIZE
};