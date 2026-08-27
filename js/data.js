const DATA_URL = 'data/hymns.json';
let records = [];
let searchIndex = [];
const normalize = value => String(value ?? '').normalize('NFKC').toLocaleLowerCase().replace(/\s+/g, ' ').trim();
export async function loadHymns() {
  if (records.length) return records;
  const metadataResponse = await fetch('data/metadata.json', {
    cache: 'no-store'
  });
  if (!metadataResponse.ok) throw new Error('metadata');
  const metadata = await metadataResponse.json();
  const version = encodeURIComponent(metadata.contentVersion || 'latest');
  const response = await fetch(`${DATA_URL}?v=${version}`, {
    cache: 'no-store'
  });
  if (!response.ok) throw new Error('data');
  const data = await response.json();
  validateData(data);
  records = [...data.hymns].sort((a, b) => a.number - b.number);
  searchIndex = records.map(hymn => ({
    hymn,
    number: String(hymn.number),
    searchableText: normalize([hymn.number, hymn.title, hymn.content?.lines?.join(' '), ...(hymn.search?.keywords || [])].join(' '))
  }));
  return records;
}
export function validateData(data) {
  if (!data || !Array.isArray(data.hymns)) throw new Error('schema');
  const ids = new Set(),
    numbers = new Set();
  for (const hymn of data.hymns) {
    if (!hymn.id || ids.has(hymn.id) || !Number.isInteger(hymn.number) || numbers.has(hymn.number) || !hymn.title || !Array.isArray(hymn.content?.lines) || !hymn.content.lines.some(Boolean)) throw new Error(`invalid hymn ${hymn.number||'record'}`);
    ids.add(hymn.id);
    numbers.add(hymn.number);
  }
}
export const getAllHymns = () => records;
export const getHymnByNumber = number => records.find(hymn => hymn.number === Number(number));
export const getHymnById = id => records.find(hymn => hymn.id === id);
export const getPreviousHymn = hymn => records[records.indexOf(hymn) - 1];
export const getNextHymn = hymn => records[records.indexOf(hymn) + 1];
export const buildHymnURL = hymn => `hymn.html?number=${encodeURIComponent(hymn.number)}`;
export function searchHymns(query) {
  const needle = normalize(query);
  if (!needle) return [];
  return searchIndex.filter(item => item.searchableText.includes(needle)).map(item => item.hymn);
}
