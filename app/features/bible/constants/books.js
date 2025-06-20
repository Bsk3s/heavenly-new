// Old Testament
export const OLD_TESTAMENT = [
  { id: 'GEN', name: 'Genesis' },
  { id: 'EXO', name: 'Exodus' },
  { id: 'LEV', name: 'Leviticus' },
  { id: 'NUM', name: 'Numbers' },
  { id: 'DEU', name: 'Deuteronomy' },
  { id: 'JOS', name: 'Joshua' },
  { id: 'JDG', name: 'Judges' },
  { id: 'RUT', name: 'Ruth' },
  { id: '1SA', name: '1 Samuel' },
  { id: '2SA', name: '2 Samuel' },
  { id: '1KI', name: '1 Kings' },
  { id: '2KI', name: '2 Kings' },
  { id: '1CH', name: '1 Chronicles' },
  { id: '2CH', name: '2 Chronicles' },
  { id: 'EZR', name: 'Ezra' },
  { id: 'NEH', name: 'Nehemiah' },
  { id: 'EST', name: 'Esther' },
  { id: 'JOB', name: 'Job' },
  { id: 'PSA', name: 'Psalms' },
  { id: 'PRO', name: 'Proverbs' },
  { id: 'ECC', name: 'Ecclesiastes' },
  { id: 'SNG', name: 'Song of Solomon' },
  { id: 'ISA', name: 'Isaiah' },
  { id: 'JER', name: 'Jeremiah' },
  { id: 'LAM', name: 'Lamentations' },
  { id: 'EZK', name: 'Ezekiel' },
  { id: 'DAN', name: 'Daniel' },
  { id: 'HOS', name: 'Hosea' },
  { id: 'JOL', name: 'Joel' },
  { id: 'AMO', name: 'Amos' },
  { id: 'OBA', name: 'Obadiah' },
  { id: 'JON', name: 'Jonah' },
  { id: 'MIC', name: 'Micah' },
  { id: 'NAM', name: 'Nahum' },
  { id: 'HAB', name: 'Habakkuk' },
  { id: 'ZEP', name: 'Zephaniah' },
  { id: 'HAG', name: 'Haggai' },
  { id: 'ZEC', name: 'Zechariah' },
  { id: 'MAL', name: 'Malachi' }
];

// New Testament
export const NEW_TESTAMENT = [
  { id: 'MAT', name: 'Matthew' },
  { id: 'MRK', name: 'Mark' },
  { id: 'LUK', name: 'Luke' },
  { id: 'JHN', name: 'John' },
  { id: 'ACT', name: 'Acts' },
  { id: 'ROM', name: 'Romans' },
  { id: '1CO', name: '1 Corinthians' },
  { id: '2CO', name: '2 Corinthians' },
  { id: 'GAL', name: 'Galatians' },
  { id: 'EPH', name: 'Ephesians' },
  { id: 'PHP', name: 'Philippians' },
  { id: 'COL', name: 'Colossians' },
  { id: '1TH', name: '1 Thessalonians' },
  { id: '2TH', name: '2 Thessalonians' },
  { id: '1TI', name: '1 Timothy' },
  { id: '2TI', name: '2 Timothy' },
  { id: 'TIT', name: 'Titus' },
  { id: 'PHM', name: 'Philemon' },
  { id: 'HEB', name: 'Hebrews' },
  { id: 'JAS', name: 'James' },
  { id: '1PE', name: '1 Peter' },
  { id: '2PE', name: '2 Peter' },
  { id: '1JN', name: '1 John' },
  { id: '2JN', name: '2 John' },
  { id: '3JN', name: '3 John' },
  { id: 'JUD', name: 'Jude' },
  { id: 'REV', name: 'Revelation' }
];

// All books in order
export const ALL_BOOKS = [...OLD_TESTAMENT, ...NEW_TESTAMENT];

// Get book by ID
export const getBookById = (id) => ALL_BOOKS.find(book => book.id === id);

// Get book name by ID
export const getBookNameById = (id) => {
  const book = getBookById(id);
  return book ? book.name : '';
};

// Check if book is in Old Testament
export const isOldTestament = (id) => OLD_TESTAMENT.some(book => book.id === id);

// Check if book is in New Testament
export const isNewTestament = (id) => NEW_TESTAMENT.some(book => book.id === id);

// Get testament name for a book
export const getTestamentName = (id) => {
  if (isOldTestament(id)) return 'Old Testament';
  if (isNewTestament(id)) return 'New Testament';
  return '';
};

const bibleBooks = {
  // ... existing data ...
};

export default bibleBooks; 