#!/usr/bin/env node
// Builds assets/manifest.json: every bundled drawing with the words the offline director matches
// against lesson text. A trailing * means "starts with" ("grow*" matches grows, growing).
// Run after adding or renaming a drawing in public/assets: node scripts/make-manifest.mjs
import { existsSync, readdirSync, writeFileSync } from 'node:fs';

/** [id, category, names] for props (things that pop up next to the caveman). */
const PROPS = [
  ['airplane', 'travel', ['airplane', 'plane', 'fly', 'flight', 'flying', 'airport', 'pilot', 'jet']],
  ['apple', 'food', ['apple', 'fruit', 'healthy', 'snack', 'gravity', 'newton']],
  ['arrow-down', 'symbols', ['down', 'fall*', 'drop*', 'decrease*', 'less', 'lower', 'sink*']],
  ['arrow-up', 'symbols', ['up', 'rise', 'rises', 'increase*', 'more', 'higher', 'climb*']],
  ['bed', 'home', ['bed', 'sleep*', 'rest', 'tired', 'nap', 'dream*']],
  ['book', 'school', ['book*', 'read*', 'story', 'stories', 'study', 'learn*', 'library', 'chapter', 'novel', 'page*']],
  ['briefcase', 'money', ['briefcase', 'work', 'job*', 'business', 'career']],
  ['burger', 'food', ['burger', 'food', 'lunch', 'dinner', 'meal*', 'hungry', 'eat*']],
  ['calendar', 'school', ['calendar', 'date', 'day', 'days', 'week*', 'month*', 'year*', 'season*', 'schedule']],
  ['car', 'travel', ['car', 'cars', 'drive', 'driving', 'road', 'travel*', 'journey', 'trip']],
  ['chart-up', 'money', ['chart', 'graph', 'data', 'growth', 'percent*', 'statistic*', 'progress', 'result*']],
  ['clock', 'symbols', ['clock', 'time', 'hour*', 'minute*', 'late', 'early', 'wait*']],
  ['coffee-cup', 'food', ['coffee', 'tea', 'cup', 'morning', 'energy']],
  ['dumbbell', 'people', ['exercise*', 'muscle*', 'strong', 'strength', 'fitness', 'workout', 'sport*']],
  ['exclamation-mark', 'symbols', ['important', 'warning', 'careful', 'danger*', 'remember', 'attention', 'wow']],
  ['gift', 'home', ['gift*', 'present', 'birthday', 'surprise', 'sharing', 'give', 'giving']],
  ['globe', 'nature', ['earth', 'world', 'globe', 'country', 'countries', 'continent*', 'geography', 'climate']],
  ['heart', 'people', ['heart*', 'love', 'care', 'kind*', 'feel*', 'blood', 'friend*']],
  ['house', 'home', ['house*', 'family', 'live', 'living', 'building*', 'roof']],
  ['laptop', 'school', ['computer*', 'laptop', 'internet', 'code', 'coding', 'program*', 'screen', 'digital', 'online']],
  ['lightbulb', 'science', ['idea*', 'think*', 'bright', 'invent*', 'electric*', 'smart', 'clever']],
  ['magnifying-glass', 'science', ['search*', 'find*', 'investigate', 'clue*', 'detail*', 'explore*', 'discover*', 'observe*']],
  ['map-pin', 'travel', ['map*', 'place*', 'location', 'city', 'town', 'visit*']],
  ['money-bag', 'money', ['money', 'cash', 'rich', 'cost*', 'price*', 'buy*', 'sell*', 'pay*', 'save*', 'rupee*', 'dollar*', 'coin*']],
  ['moon', 'nature', ['moon', 'tide*', 'lunar', 'phase*']],
  ['phone', 'home', ['phone*', 'call*', 'message*', 'mobile']],
  ['pill', 'people', ['medicine*', 'pill*', 'sick', 'doctor*', 'ill', 'cure', 'vitamin*', 'health*']],
  ['pizza', 'food', ['pizza', 'fraction*', 'slice*', 'half', 'party']],
  ['planet', 'nature', ['planet*', 'orbit*', 'mars', 'jupiter', 'saturn', 'universe', 'galaxy']],
  ['plant', 'nature', ['plant*', 'leaf', 'leaves', 'tree*', 'flower*', 'seed*', 'grow*', 'photosynthesis', 'garden*', 'soil', 'root*', 'nature']],
  ['question-mark', 'symbols', ['question*', 'wonder*', 'mystery', 'puzzle*', 'quiz']],
  ['rocket', 'science', ['rocket*', 'launch*', 'astronaut*', 'blast']],
  ['speech-bubble', 'people', ['say*', 'said', 'speak*', 'word*', 'language*', 'tell*', 'conversation', 'vocabulary']],
  ['star', 'nature', ['star', 'stars', 'sun', 'shine*', 'best', 'great', 'excellent', 'famous']],
  ['telescope', 'science', ['telescope*', 'sky', 'astronomy', 'far']],
  ['trophy', 'school', ['win*', 'trophy', 'prize*', 'champion*', 'success*', 'goal*', 'achieve*', 'victory']],
  ['water-bottle', 'food', ['water', 'drink*', 'bottle*', 'thirst*', 'hydrat*', 'liquid*', 'rain*']],
  ['weighing-scale', 'science', ['weight*', 'weigh*', 'mass', 'heavy', 'balance*', 'measure*', 'kilogram*', 'gram*']],
];

/** [id, names] for backgrounds (settings). A setting stays until the lesson moves somewhere new. */
const SETTINGS = [
  ['bg-airport', ['airport', 'airports']],
  ['bg-bank', ['bank', 'banks']],
  ['bg-beach', ['beach*', 'sea', 'ocean*', 'sand', 'coast*', 'holiday*']],
  ['bg-bedroom', ['bedroom*']],
  ['bg-cafe', ['cafe', 'restaurant*']],
  ['bg-city-street', ['city', 'cities', 'street*', 'traffic']],
  ['bg-classroom', ['classroom*', 'school*', 'class', 'teacher*', 'lesson*', 'student*']],
  ['bg-gym', ['gym*']],
  ['bg-hospital', ['hospital*', 'nurse*', 'patient*']],
  ['bg-kitchen', ['kitchen*', 'cook*', 'recipe*']],
  ['bg-lab', ['lab', 'labs', 'laboratory', 'experiment*', 'scientist*', 'chemistry']],
  ['bg-living-room', ['home', 'living room']],
  ['bg-mountains', ['mountain*', 'hill*', 'valley*', 'river*', 'forest*', 'volcano*']],
  ['bg-night-sky', ['night*', 'sky', 'stars', 'dark']],
  ['bg-office', ['office*', 'meeting*']],
  ['bg-park', ['park*', 'outside', 'outdoor*', 'playground*']],
  ['bg-space', ['space', 'universe', 'galaxy', 'astronaut*', 'orbit*']],
  ['bg-stage', ['stage', 'show*', 'perform*', 'theatre', 'theater', 'concert*']],
  ['bg-store', ['shop*', 'store*', 'market*']],
];

const assets = [
  ...PROPS.map(([id, category, names]) => ({ id, file: `assets/${id}.svg`, kind: 'prop', category, names, kidSafeReviewed: true })),
  ...SETTINGS.map(([id, names]) => ({ id, file: `assets/${id}.svg`, kind: 'setting', category: 'settings', names, kidSafeReviewed: true })),
];

for (const a of assets) if (!existsSync(`public/${a.file}`)) throw new Error(`missing drawing: public/${a.file}`);
const known = new Set(assets.map((a) => a.id));
const untagged = readdirSync('public/assets').map((f) => f.replace(/\.svg$/, '')).filter((id) => !known.has(id));
if (untagged.length) throw new Error(`drawings without tags: ${untagged.join(', ')}`);

writeFileSync('assets/manifest.json', `${JSON.stringify({ version: 1, licence: 'CC0-1.0', assets }, null, 1)}\n`);
console.log(`assets/manifest.json: ${assets.length} drawings`);
