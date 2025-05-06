import initialCharacters from './initial-characters.json';
import { PAGE_SIZE as _PAGE_SIZE, totalCharacters as _totalCharacters } from './staticCharacters.js';

export const PAGE_SIZE = _PAGE_SIZE;
export const totalCharacters = _totalCharacters;
export const totalPages = Math.ceil(totalCharacters / PAGE_SIZE);
export const staticCharacters = initialCharacters.slice(0, PAGE_SIZE);

export const initialState = {
  characters: staticCharacters,
  totalCharacters,
  totalPages,
  pageSize: PAGE_SIZE
};