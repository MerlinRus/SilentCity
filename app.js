const select = (selector) => document.querySelector(selector);
const world = select('#world');
const dialog = select('#room-dialog');
const content = select('#room-content');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let residentNoteChange = null;
let residentSizeKey = '';
function cancelUiMotion() {
  finishResidentNoteChange();
  content.getAnimations?.({ subtree: true }).forEach((animation) => animation.cancel());
  finishExplorationTransition();
  finishRadioTravel();
}
document.addEventListener('pointerdown', () => document.documentElement.classList.add('pointer-motion'), { capture: true, passive: true });
document.addEventListener('keydown', () => {
  if (!document.documentElement.classList.contains('pointer-motion')) return;
  document.documentElement.classList.remove('pointer-motion');
  cancelUiMotion();
}, { capture: true });
reducedMotion.addEventListener('change', cancelUiMotion);
function revealContent(element) {
  element.getAnimations?.().forEach((animation) => animation.cancel());
  if (reducedMotion.matches || !document.documentElement.classList.contains('pointer-motion') || !element.animate) return;
  element.animate([{ opacity: .5, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 180, easing: 'cubic-bezier(.23,1,.32,1)' });
}
const iconPaths = {
  back: 'M20 12H4m6-6-6 6 6 6',
  mixer: 'M4 7h6m4 0h6M4 17h10m4 0h2M10 4v6m4 4v6',
  radio: 'M4 8h16v12H4ZM7 8l10-5M8 12v4m-2-2h4m4-2h3m-3 4h3',
  external: 'M7 17 17 7M7 7h10v10',
  notes: 'M8 4h11v14M5 7h11v14H5ZM8 11h5m-5 4h5',
  music: 'M9 18V5l11-2v13M9 8l11-2M9 18a3 2 0 1 1-6 0 3 2 0 1 1 6 0m11-2a3 2 0 1 1-6 0 3 2 0 1 1 6 0',
  pencil: 'm4 16 11-11 4 4L8 20H4Zm9-9 4 4',
  clock: 'M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0M12 7v5l3 2'
};
function svgIcon(name) {
  return `<svg class="ui-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${iconPaths[name]}"/></svg>`;
}
let randomState = 1887;
function random() {
  randomState = (randomState * 1664525 + 1013904223) >>> 0;
  return randomState / 4294967296;
}

const points = (coordinates) => coordinates.map((point) => point.join(',')).join(' ');
const polygon = (coordinates, fill, attributes = '') => `<polygon points="${points(coordinates)}" fill="${fill}" ${fill === 'url(#reflection)' ? 'class="ground-reflection"' : ''} ${attributes}/>`;
const residents = [
  { name: 'Лена', place: 'Шестой этаж · окно с чайником', row: 0, column: 1, object: 'M57 76h19v13H57Zm19 2h4a4 4 0 0 1 0 8h-4M61 70c-4-4 4-6 0-10m7 10c-4-4 4-6 0-10', notes: [
    { id: 'lena-tea', title: 'Чайник уже закипел', text: 'Опять заварила на двоих, хотя дома одна. Вторую чашку мысленно оставляю тебе. Сиди сколько хочется.' },
    { id: 'lena-bread', title: 'Почти по рецепту', text: 'Испекла хлеб. Снизу подгорел, сверху красавец. Отрезала корочку и съела ещё тёплым, прямо у окна.' },
    { id: 'lena-umbrella', title: 'Чужой зонт', text: 'Взяла в кафе не свой зонт. Этот весь в маленьких утках. Завтра верну, а сегодня дождь был неожиданно весёлым.' },
    { id: 'lena-laundry', title: 'Тёплая наволочка', text: 'Разбирала бельё и нашла в пододеяльнике один носок. Второй всё ещё где-то путешествует. Не тороплю его.' },
    { id: 'lena-soup', title: 'На маленьком огне', text: 'Суп тихонько булькает. В квартире пахнет укропом. Первый вечер за неделю, когда я никуда не опаздываю.' },
    { id: 'lena-call', title: 'Позвонила маме', text: 'Собиралась на пять минут, проговорили сорок. Мама подробно рассказала про голубя на балконе. Хороший был голубь.' },
    { id: 'lena-book', title: 'Билет между страниц', text: 'В старой книге нашёлся билет на поезд. Не помню сюжет, зато помню чай в подстаканнике и сосны за окном.' },
    { id: 'lena-cup', title: 'Та самая кружка', text: 'У моей любимой кружки отбилась ручка. Теперь держу двумя ладонями. Чай всё такой же, только руки теплее.' },
    { id: 'lena-neighbor', title: 'Соседка сверху', text: 'Отнесла соседке кусок пирога. Вернулась с тремя яблоками и историей про её первую работу. Неплохой обмен.' },
    { id: 'lena-fridge', title: 'Список на завтра', text: 'На холодильнике написано: молоко, батарейки, погулять. Последний пункт всё время забываю. Сегодня обвела его.' },
    { id: 'lena-scarf', title: 'Ещё один ряд', text: 'Вяжу шарф с сентября. Он уже длиннее меня, а пряжа не кончается. Похоже, к зиме одену весь подъезд.' },
    { id: 'lena-morning', title: 'Всё приготовлено', text: 'Положила на стол чистую ложку и любимый чай. Маленький подарок завтрашней себе. Утром она обычно сонная.' }
  ] },
  { name: 'Миша', place: 'Пятый этаж · окно с пластинками', row: 1, column: 5, object: 'M49 74h39v16H49Zm29 8a10 4 0 1 1-20 0 10 4 0 1 1 20 0m5-5 2-5h5', notes: [
    { id: 'misha-record', title: 'Последняя сторона', text: 'Пластинка закончилась минут десять назад. Всё сижу, слушаю, как шуршит игла. Иногда и этого достаточно.' },
    { id: 'misha-piano', title: 'Знакомые три ноты', text: 'За стеной учат одну мелодию. Уже третий вечер. Сегодня сыграли без ошибки, и я тихонько похлопал в стену.' },
    { id: 'misha-cover', title: 'На обороте обложки', text: 'Купил старую пластинку. На конверте написано: «Саше, чтобы не скучал». Саша, если что, музыка всё ещё хорошая.' },
    { id: 'misha-tram', title: 'Пропустил остановку', text: 'Заслушался и проехал свой поворот. Шёл домой пешком мимо булочной. Теперь думаю, что всё правильно получилось.' },
    { id: 'misha-radio', title: 'Поймал волну', text: 'Крутил ручку старого радио и наткнулся на песню из детства. Название не успели сказать. Напеваю, пока помню.' },
    { id: 'misha-cat', title: 'Новый слушатель', text: 'Дворовый кот сидит под окном, пока играет джаз. На саксофоне щурится. Возможно, просто фонарь светит в глаза.' },
    { id: 'misha-cassette', title: 'Карандаш пригодился', text: 'Нашёл кассету со школьной записью. Плёнку пришлось подкрутить карандашом. Наш басист всё ещё немного спешит.' },
    { id: 'misha-work', title: 'Ноутбук закрыт', text: 'Отправил последний файл и закрыл крышку. Пластинка выбиралась дольше, чем вся работа. Зато теперь точно та.' },
    { id: 'misha-rain', title: 'Без ударных', text: 'Выключил музыку: дождь по жестяному подоконнику сегодня играет лучше. Особенно та капля, которая всё время мимо ритма.' },
    { id: 'misha-shelf', title: 'По алфавиту не вышло', text: 'Хотел разобрать пластинки, но каждую вторую включал. На полке всё ещё беспорядок. Вечер зато удался.' },
    { id: 'misha-friend', title: 'Один трек в ответ', text: 'Друг прислал песню без единого слова. Не виделись полгода, а я сразу понял, что у него всё нормально.' },
    { id: 'misha-quiet', title: 'Погромче тишину', text: 'Снял наушники, а в комнате гудит холодильник и кто-то идёт по лестнице. Ничего особенного. Просто я уже дома.' }
  ] },
  { name: 'Соня', place: 'Первый этаж · окно с растениями', row: 5, column: 0, object: 'M61 77h18l-3 13H64Zm9 0V54m0 14c-10 0-13-7-13-11 9 0 13 4 13 11Zm0-7c9 0 12-7 12-11-8 0-12 4-12 11Z', notes: [
    { id: 'sonya-leaf', title: 'Кажется, новый лист', text: 'Поливала цветы и заметила маленький лист у фикуса. Три недели ничего, а потом — вот. На сегодня хороших новостей хватит.' },
    { id: 'sonya-cutting', title: 'Корешок в стакане', text: 'Черенок, который дали в автобусе, пустил корни. Женщину звали Нина. Нина, у нас с вашим цветком всё получается.' },
    { id: 'sonya-basil', title: 'Базилик на ужин', text: 'Вырастила базилик и теперь жалею срывать листья. Пока просто нюхаю его над макаронами. Тоже вполне работает.' },
    { id: 'sonya-snail', title: 'Кто-то ел салат', text: 'На балконе обнаружилась улитка. Дала ей имя и кусочек огурца. Судя по всему, теперь у меня есть планы на отпуск.' },
    { id: 'sonya-pot', title: 'Горшок из барахолки', text: 'Нашла синий горшок с неровным краем. Фикус в нём чуть кривоват. Зато вместе они выглядят очень уверенно.' },
    { id: 'sonya-window', title: 'Чистое стекло', text: 'Вымыла окно. Оказалось, на доме напротив есть маленький флюгер. Живу здесь третий год, а кораблик заметила только сегодня.' },
    { id: 'sonya-seed', title: 'На пакетике — июнь', text: 'Разбирала семена на подоконнике. За стеклом мокрый октябрь, а на каждом пакетике уже лето. Разложила по цветам.' },
    { id: 'sonya-walk', title: 'Лист в кармане', text: 'Принесла с прогулки жёлтый лист. Дома он оказался ещё красивее. Положила в книгу, которую когда-нибудь дочитаю.' },
    { id: 'sonya-light', title: 'Переставила лампу', text: 'Подвинула лампу к цветам. Теперь от монстеры на стене огромная тень. Сижу в своей маленькой ночной оранжерее.' },
    { id: 'sonya-gift', title: 'Один оставила себе', text: 'Укоренила пять отростков, раздала четыре. Теперь у друзей на окнах живут кусочки моего подоконника. Приятно об этом думать.' },
    { id: 'sonya-balcony', title: 'После дождя', text: 'Открыла балкон, и запахло мокрой землёй. Даже чай немного остыл, пока стояла. Пожалуй, заварю ещё.' },
    { id: 'sonya-drawing', title: 'Третий лист справа', text: 'Рисовала свой фикус. Получилось дерево, которого не существует. Повесила рисунок рядом: пусть у него будет компания.' }
  ] }
];
const residentNoteIds = new Set(residents.flatMap((resident) => resident.notes.map((note) => note.id)));
let readResidentNotes = new Set();
let lastResidentNote = null;
try {
  const saved = JSON.parse(localStorage.getItem('after-rain-resident-notes-v1'));
  if (Array.isArray(saved?.read)) readResidentNotes = new Set(saved.read.filter((id) => residentNoteIds.has(id)));
  if (residentNoteIds.has(saved?.last)) lastResidentNote = saved.last;
} catch {}
function chooseResidentNote(index) {
  const notes = residents[index].notes;
  let unread = notes.filter((note) => !readResidentNotes.has(note.id));
  if (!unread.length) {
    notes.forEach((note) => readResidentNotes.delete(note.id));
    unread = notes.filter((note) => note.id !== lastResidentNote);
  }
  const note = unread[Math.floor(Math.random() * unread.length)];
  readResidentNotes.add(note.id);
  lastResidentNote = note.id;
  try { localStorage.setItem('after-rain-resident-notes-v1', JSON.stringify({ read: [...readResidentNotes], last: lastResidentNote })); } catch {}
  return note;
}
const residentWindows = [];
const city = [];
city.push(`<svg viewBox="0 0 1600 1000" xmlns="http://www.w3.org/2000/svg" role="group" aria-labelledby="city-title"><title id="city-title">Тихий квартал: кафе, радио, заметки, комната для фокуса и три окна с записками жителей</title><defs>
  <linearGradient id="road" x2="0" y2="1"><stop stop-color="#253a3b"/><stop offset="1" stop-color="#172b31"/></linearGradient>
  <linearGradient id="glass" x2="0" y2="1"><stop stop-color="#f0cb8f"/><stop offset="1" stop-color="#c28d52"/></linearGradient>
  <linearGradient id="reflection" x2="0" y2="1"><stop stop-color="#d3b17a" stop-opacity=".18"/><stop offset="1" stop-color="#d3b17a" stop-opacity="0"/></linearGradient>
  <radialGradient id="lamp"><stop stop-color="#f4d299" stop-opacity=".24"/><stop offset="1" stop-color="#f4d299" stop-opacity="0"/></radialGradient>
  <pattern id="pavement" width="40" height="20" patternUnits="userSpaceOnUse" patternTransform="rotate(13)"><path d="M0 0H40M0 20H40M20 0V20" fill="none" stroke="#7a9990" stroke-opacity=".06" stroke-width=".8"/></pattern>
  </defs>`);

function building({ x, y, width, height, depth, rows, columns, color = '#263b3b', side = '#1c3032', roof = '#344947', lit = .28, detail = true }) {
  const slope = width * .2;
  const recess = depth * .56;
  city.push(polygon([[x - 25, y + height + 5], [x + width, y + height + slope + 25], [x + width + depth + 90, y + height + slope - recess + 30], [x + depth, y + height - recess]], '#091c2370'));
  city.push(polygon([[x, y], [x + depth, y - recess], [x + width + depth, y + slope - recess], [x + width, y + slope]], roof));
  city.push(polygon([[x, y], [x + width, y + slope], [x + width, y + slope + height], [x, y + height]], color));
  city.push(polygon([[x + width, y + slope], [x + width + depth, y + slope - recess], [x + width + depth, y + slope - recess + height], [x + width, y + slope + height]], side));
  city.push(`<path class="roof-edge" d="M${x},${y + 5} l${width},${slope} l${depth},${-recess}" stroke="#98a99a" stroke-opacity=".15" fill="none" stroke-width="3"/>`);
  const rowSpacing = (height - 50) / rows;
  const windowHeight = Math.min(29, rowSpacing * .58);
  for (let row = 0; row < rows; row++) {
    const windowY = y + 30 + row * rowSpacing;
    if (detail) city.push(`<path d="M${x} ${windowY + (windowHeight + rowSpacing) / 2}l${width} ${slope}" stroke="#101f23" stroke-opacity=".28" fill="none"/>`);
    for (let column = 0; column < columns; column++) {
      const windowX = x + 17 + column * ((width - 25) / columns);
      const offset = (windowX - x) * .2;
      const windowWidth = (width - 25) / columns * .49;
      const isLit = random() < lit;
      const tint = random() > .65 ? '#d4bd8b' : '#b79865';
      const shape = [[windowX, windowY + offset], [windowX + windowWidth, windowY + offset + windowWidth * .2], [windowX + windowWidth, windowY + offset + windowWidth * .2 + windowHeight], [windowX, windowY + offset + windowHeight]];
      const nightWindow = isLit && detail && (row + column) % 2 === 0;
      if (isLit) {
        city.push(polygon(shape, '#142a2d', 'opacity=".7"'));
        city.push(`<g class="window-lamp${nightWindow ? ` night-window night-window-${1 + (row + column) % 3}` : ''}">`);
      }
      city.push(polygon(shape, isLit ? tint : '#142a2d', `opacity="${isLit ? .55 + random() * .4 : .7}"`));
      if (isLit && detail) {
        city.push(`<ellipse cx="${windowX + windowWidth / 2}" cy="${windowY + offset + windowHeight / 2}" rx="${windowWidth + 8}" ry="${windowHeight + 6}" fill="url(#lamp)" opacity=".5"/>`);
        city.push(`<path d="M${windowX + windowWidth * .55} ${windowY + offset + windowWidth * .11}v${windowHeight}" stroke="#273b37" stroke-width="2" opacity=".75"/>`);
        if (random() > .5) city.push(polygon([[windowX, windowY + offset], [windowX + windowWidth * .35, windowY + offset + 2], [windowX + windowWidth * .24, windowY + offset + windowHeight], [windowX, windowY + offset + windowHeight]], '#635f48', 'opacity=".6"'));
      }
      if (isLit) city.push('</g>');
      if (x === 858) {
        const residentIndex = residents.findIndex((resident) => resident.row === row && resident.column === column);
        if (residentIndex !== -1) residentWindows[residentIndex] = { x: windowX, y: windowY + offset, width: windowWidth, height: windowHeight };
      }
    }
    const sideCount = Math.max(1, Math.floor(depth / 28));
    for (let column = 0; column < sideCount; column++) {
      const sideX = x + width + 14 + column * ((depth - 15) / sideCount);
      const sideY = windowY + slope - (sideX - x - width) * .56;
      city.push(polygon([[sideX, sideY], [sideX + 13, sideY - 7.3], [sideX + 13, sideY + 16], [sideX, sideY + 23]], random() < lit * .6 ? '#ae9868' : '#11282c', 'opacity=".65"'));
    }
  }
  if (detail) {
    city.push(`<path d="M${x + width - 6} ${y + slope + 8}v${height - 10}" stroke="#677c71" stroke-opacity=".3" stroke-width="3"/>`);
    city.push(polygon([[x + depth * .6, y - recess * .4 - 13], [x + depth * .6 + 36, y - recess * .4 - 6], [x + depth * .6 + 52, y - recess * .4 - 15], [x + depth * .6 + 16, y - recess * .4 - 22]], '#455650'));
    city.push(polygon([[x + depth * .6, y - recess * .4 - 13], [x + depth * .6 + 36, y - recess * .4 - 6], [x + depth * .6 + 36, y - recess * .4 + 6], [x + depth * .6, y - recess * .4 - 1]], '#2b3e3d'));
  }
}

for (let index = 0; index < 20; index++) {
  const x = 350 + index * 74;
  const height = 95 + random() * 140;
  building({ x, y: 420 - height, width: 58 + random() * 45, height, depth: 24, rows: 6, columns: 3, color: '#243a3b', side: '#203537', roof: '#2b4140', lit: .08, detail: false });
}
city.push(`<path d="M440 519 1080 375 1730 616 1120 960 380 697Z" fill="url(#road)"/>`);
city.push(`<path d="m474 544 606-139 574 216M612 701l490 145 496-229" fill="none" stroke="#9aafa0" stroke-opacity=".13" stroke-width="2"/>`);
city.push(`<path d="m610 604 400 105 465-187" fill="none" stroke="#c0c9b1" stroke-opacity=".14" stroke-width="2" stroke-dasharray="25 25"/>`);
city.push(`<g id="city-tram" aria-hidden="true" pointer-events="none">
  <ellipse cx="27" cy="-9" rx="55" ry="12" transform="rotate(-27 27 -9)" fill="#091d24" opacity=".45"/>
  <path class="tram-body" d="M0 0 70-35V-62L0-27Z" fill="#78857a"/><path class="tram-front" d="M0 0-18-9v-27L0-27Z" fill="#465e58"/>
  <path class="tram-roof" d="M0-27 70-62 52-71-18-36Z" fill="#8b9584"/>
  <path d="m7-27 12-6v15L7-12Zm17-8 12-6v15l-12 6Zm17-8 12-6v15l-12 6Zm17-8 6-3v15l-6 3Z" fill="#d5bd86" opacity=".8"/>
  <path d="m-14-29 10 5v12l-10-5Z" fill="#b9b485" opacity=".65"/><path d="m0-6 70-35" stroke="#b4b098" stroke-width="2"/>
  <path d="m12-2 8-4v4l-8 4Zm39-20 8-4v4l-8 4Z" fill="#142a2d"/>
  <path d="m21-48 7-18 14 5-7 12M-15-8l7 3" fill="none" stroke="#8d9a88" stroke-width="1.5"/>
</g>`);
building({ x: 1340, y: 218, width: 185, height: 330, depth: 100, rows: 9, columns: 5, color: '#2b4140', lit: .13 });
building({ x: 1060, y: 310, width: 173, height: 236, depth: 100, rows: 6, columns: 4, color: '#2a4140', lit: .15 });
building({ x: 610, y: 365, width: 152, height: 225, depth: 100, rows: 6, columns: 4, color: '#2e4140', lit: .21 });
city.push(`<path d="m692 593 442 94 175-83 3 17-175 92-446-101Z" fill="#58665b" opacity=".38"/>`);
city.push(`<path d="m692 612 442 94 175-83v18l-175 92-442-101Z" fill="url(#pavement)"/>`);
building({ x: 858, y: 240, width: 270, height: 405, depth: 122, rows: 9, columns: 6, color: '#344540', side: '#233a37', roof: '#41514a', lit: .32 });
city.push(`<g transform="translate(875 392) skewY(11.3)" aria-hidden="true" pointer-events="none">
  <path d="M0 0h20v23H0Z" fill="#b39b6e" opacity=".6"/><path d="M-2 24h25" stroke="#8a987e" stroke-width="2"/>
  <g class="cat-figure"><path d="M7 23c-5 0-4-5-2-9 1-3 5-3 7 0l4 9Zm6-2c10 0 8-10 4-8" fill="#172e2e" stroke="#172e2e" stroke-width="2" stroke-linecap="round"/>
  <g class="cat-head"><path d="m5 13-1-9 4 3 3-1 4-3v9c-2 4-8 5-10 1Z" fill="#172e2e"/><path d="M6 10h2m3-1h2" stroke="#d3c18d" stroke-width="1" stroke-linecap="round"/></g></g>
  <path d="M0 0h3L2 23H0Zm20 0h-3l1 23h2Z" fill="#6e775e" opacity=".6"/>
</g>`);
city.push(`<path d="m875 246 28-16 0-66m-13 22 27 5m-14-13 16-8" stroke="#53645b" stroke-width="2" fill="none"/>`);
city.push(`<path d="m861 603 266 54 122-69v17l-122 69-266-54Z" fill="#152c2d"/>`);
city.push(polygon([[860, 608], [1128, 661], [1128, 702], [860, 649]], '#1a302e'));
for (let index = 0; index < 7; index++) {
  const x = 868 + index * 37;
  const y = 616 + index * 7.4;
  city.push(polygon([[x, y], [x + 28, y + 5.6], [x + 28, y + 39], [x, y + 33.4]], 'url(#glass)', 'opacity=".76"'));
  city.push(`<path d="M${x + 3} ${y + 12}l23 4.6m-11-13v33" stroke="#534d35" stroke-width="1.5" opacity=".7"/>`);
  city.push(polygon([[x, y + 42], [x + 28, y + 48], [x - 40, y + 171], [x - 95, y + 160]], 'url(#reflection)'));
}
city.push(`<path d="m855 607 277 55-5 14-277-55Z" fill="#8d8966"/><path d="m855 607 277 55" stroke="#c9bb88" stroke-opacity=".65" stroke-width="2"/>`);
city.push(`<text x="937" y="636" fill="#433e2c" font-size="12" letter-spacing="3" transform="rotate(11.3 937 636)">НЕ СПИТСЯ</text>`);
city.push(`<path d="m1131 664 116-65v60l-116 65Z" fill="#152b2b"/><path d="m1146 667 27-15v42l-27 15Z" fill="#4a5844" opacity=".55"/>
  <g class="entrance-lights" aria-hidden="true" pointer-events="none" fill="#d5ba83">
    <path d="m1142 553 13-7v23l-13 7Zm0 39 13-7v23l-13 7Zm0 40 13-7v23l-13 7Z"/>
    <path d="m1146 667 27-15v42l-27 15Z"/><ellipse cx="1155" cy="712" rx="30" ry="9" fill="url(#lamp)"/>
  </g>`);
city.push(`<path d="m730 729 390 82 245-133 0 4-245 136-390-82Z" fill="#6f8271" opacity=".26"/>`);
city.push(`<path d="m0 908 460-190 282 61 360 221Z" fill="#11262b"/>`);
city.push(`<path d="m1003 882 264-151 333 99v170h-390Z" fill="#0c2127"/>`);

function tree(x, y, scale = 1) {
  city.push(`<g transform="translate(${x} ${y}) scale(${scale})"><ellipse cy="4" rx="28" ry="10" fill="#081c2380"/><path d="M0 0v-74m0 32-17-21m17 10 16-21" fill="none" stroke="#152a28" stroke-width="5"/><path d="M-6-108C-45-102-46-69-27-57c-23 17 10 41 29 29 30 9 49-21 29-37 15-22-5-48-37-43Z" fill="#203d32"/><path d="M-10-99c-25 6-32 23-22 34 2-21 18-23 27-20 1-9 6-13 17-11Z" fill="#3c5140" opacity=".4"/></g>`);
}
tree(773, 637, .92); tree(1295, 660, 1.03); tree(1330, 682, .9); tree(1470, 758, 1.5); tree(572, 686, 1.2); tree(1370, 718, .92);
function lamp(x, y, height = 100) {
  city.push(`<g class="street-lamp"><ellipse class="lamp-glow" cx="${x}" cy="${y + 2}" rx="49" ry="16" fill="url(#lamp)"/><path d="M${x} ${y}v-${height}q0-10 13-7l10 2" fill="none" stroke="#6c7c6b" stroke-width="2.5"/><ellipse class="lamp-glow" cx="${x + 21}" cy="${y - height - 3}" rx="8" ry="3" fill="#ecd7a3"/><ellipse class="lamp-glow" cx="${x + 21}" cy="${y - height + 12}" rx="53" ry="60" fill="url(#lamp)"/><path class="ground-reflection lamp-glow" d="m${x + 18} ${y + 8}-28 63 10 2 29-64" fill="url(#reflection)"/></g>`);
}
lamp(799, 699, 105); lamp(1210, 777, 105); lamp(1445, 651, 90); lamp(654, 630, 85);
city.push(`<g class="city-car" transform="translate(1330 735) rotate(-28)"><ellipse rx="43" ry="21" fill="#071b2266"/><rect class="car-body" x="-34" y="-20" width="68" height="30" rx="10" fill="#60736c"/><rect x="-16" y="-19" width="31" height="28" rx="7" fill="#233b3a"/><path d="M-31-10h10m-10 11h10M21-10h8M21 1h8" stroke="#d6caa0" stroke-width="3"/></g>`);
city.push(`<g class="courtyard-details" aria-hidden="true" pointer-events="none">
  <g class="city-bicycle" transform="translate(833 685) rotate(11.3) scale(.8)"><ellipse cx="16" cy="11" rx="31" ry="5" fill="#0a2026" opacity=".6"/>
    <g class="bicycle-frame" fill="none" stroke="#8b9c86" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" opacity=".75"><circle r="10"/><circle cx="32" r="10"/><path d="m0 0 10-17L14 0H0m14 0 11-17 7 17M10-17h15l-2-5h-5M10-17 7-23H3"/></g>
  </g>
  <g class="city-umbrella" transform="translate(1138 712) rotate(-25)"><path class="umbrella-canopy" d="M-17-10Q0-35 17-10 8-15 0-10q-8-5-17 0Z" fill="#7f8c75"/><path class="umbrella-handle" d="M0-10v28q0 7 6 5M0-25v-4" fill="none" stroke="#c0ad83" stroke-width="1.5" stroke-linecap="round"/></g>
  <g class="city-boat" transform="translate(790 774) rotate(11.3)"><ellipse class="boat-water" rx="36" ry="8" fill="#8ba69a" opacity=".13"/>
    <path class="boat-sail" d="m-12-4 12-13L12-4Z" fill="#c7c6ab" opacity=".75"/><path class="boat-hull" d="M-18-3h36L10 5H-8Z" fill="#a8b3a1"/><path class="boat-folds" d="M0-17V-4M-18-3 0 2l18-5m-44 14h16m18 2h13" fill="none" stroke="#6f8982" stroke-width="1"/>
  </g>
</g>`);
for (let index = 0; index < 95; index++) {
  const x = 550 + random() * 1000;
  const y = 700 + random() * 220;
  city.push(`<path d="M${x} ${y}l${8 + random() * 28} ${random() * 2}" stroke="${random() > .75 ? '#c6b17f' : '#6c9490'}" stroke-opacity="${random() * .17}"/>`);
}
function marker(x, y, label, icon, room, labelWidth = 98) {
  city.push(`<g class="city-place" role="button" tabindex="0" aria-label="${label}" data-room="${room}"><rect x="${x - 50}" y="${y - 55}" width="100" height="100" fill="transparent" pointer-events="all"/><g class="place-marker"><rect class="marker-bg" x="${x - 17}" y="${y - 22}" width="34" height="34" rx="17" fill="#233c38" stroke="#c8bb8f" stroke-opacity=".65"/><svg x="${x - 9}" y="${y - 14}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1dbad" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[icon]}"/></svg><path d="m${x - 4} ${y + 12} 4 5 4-5" fill="#233c38" stroke="#c8bb8f" stroke-opacity=".65"/><rect x="${x - labelWidth / 2}" y="${y - 49}" width="${labelWidth}" height="21" rx="10" fill="#1d3332" fill-opacity=".95"/><text x="${x}" y="${y - 35}" text-anchor="middle" font-size="10" fill="#cfceaf">${label}</text></g></g>`);
}
city.push(`<g class="city-life" aria-hidden="true" pointer-events="none">
  <g id="city-walker" class="city-actor"><ellipse cy="1" rx="8" ry="3" fill="#102b2c" opacity=".3"/><g class="walker-person"><path d="m-3-10-2 10m7-10 3 10" stroke="#314b45" stroke-width="3" stroke-linecap="round"/><path d="M-5-24h9l2 15H-6Z" fill="#bc9b72"/><circle cy="-29" r="4" fill="#d8bea1"/><path d="m-5-22-5 11m14-11 5 8" stroke="#bc9b72" stroke-width="3" stroke-linecap="round"/><g class="walker-umbrella"><path d="M-18-35Q0-57 18-35q-9-5-18 0-9-5-18 0Z" fill="#986e59" stroke="#4f5646"/><path d="M0-35v21" stroke="#d6c5a0" stroke-width="1.5"/></g></g></g>
  <g id="city-cyclist" class="city-actor"><ellipse cx="16" cy="8" rx="30" ry="4" fill="#102b2c" opacity=".3"/><g transform="rotate(11.3)"><g fill="none" stroke="#a3b297" stroke-width="2"><circle r="10"/><circle cx="34" r="10"/><path d="m0 0 10-17L16 0H0m16 0 10-17 8 17M10-17h16l-2-5h-5"/></g><path d="m13-27 10 6-8 11 9 6" fill="none" stroke="#c6ad88" stroke-width="3" stroke-linecap="round"/><path d="m13-29-4 11 6 7" fill="none" stroke="#798f80" stroke-width="6" stroke-linecap="round"/><circle cx="17" cy="-35" r="4" fill="#dcc2a0"/><path d="m18-31 7 9h6" fill="none" stroke="#798f80" stroke-width="3" stroke-linecap="round"/></g></g>
  <g id="city-driving" class="city-actor"><g transform="rotate(11.3)"><ellipse rx="40" ry="17" fill="#102b2c" opacity=".3"/><rect x="-36" y="-20" width="72" height="28" rx="9" fill="#a68f71" stroke="#4b665a"/><rect x="-18" y="-19" width="32" height="25" rx="5" fill="#354e47"/><path d="m-32-12 9 0m-9 12h9m43-12h5m-5 12h5" stroke="#e0ce9c" stroke-width="3"/></g></g>
  <g id="city-neighbour" class="city-actor"><ellipse cy="1" rx="8" ry="3" fill="#102b2c" opacity=".3"/><path d="m-3-10-1 10m6-10 2 10" stroke="#354f47" stroke-width="3" stroke-linecap="round"/><path d="M-5-24h10l1 15H-6Z" fill="#8f9b7a"/><circle cy="-29" r="4" fill="#dac09e"/><path d="m-5-21-5 10m15-10 7 3" fill="none" stroke="#8f9b7a" stroke-width="3" stroke-linecap="round"/><path d="M10-21h5v6h-5Zm5 1q5 0 0 4" fill="#e0c699" stroke="#786e51" stroke-width="1"/></g>
</g>`);
marker(952, 602, 'Кафе «Не спится»', 'music', 'radio', 128);
marker(1018, 427, 'Твои мысли', 'pencil', 'notes');
marker(1172, 363, 'Тихая комната', 'clock', 'focus');
marker(1110, 538, 'Радио', 'radio', 'live-radio');
residents.forEach((resident, index) => {
  const { x, y, width, height } = residentWindows[index];
  city.push(`<g class="resident-window${index === 0 ? ' is-lit' : ''}" role="button" tabindex="0" aria-label="Записка из окна: ${resident.name}" aria-haspopup="dialog" data-resident="${index}" transform="translate(${x} ${y}) skewY(11.3)">
    <rect class="resident-hit" x="${width / 2 - 48}" y="${height / 2 - 48}" width="96" height="96" fill="transparent" pointer-events="all"/>
    <rect width="${width}" height="${height}" fill="#142a2d"/>
    <g class="resident-light" pointer-events="none"><ellipse cx="${width / 2}" cy="${height / 2}" rx="${width * 1.8}" ry="${height * 1.6}" fill="url(#lamp)"/><rect width="${width}" height="${height}" fill="url(#glass)"/>
    <path d="M2 0 5 ${height}H0V0M${width - 2} 0l-3 ${height}h5V0" fill="#77694c" opacity=".65"/>
    <path d="M${width * .3} ${height * .55}h${width * .4}l-${width * .1}-${height * .25}h-${width * .2}Zm${width * .2} 0v${height * .3}m-4 0h8" fill="#f7dfae" stroke="#6a6044" stroke-width=".8"/>
    </g><path class="resident-frame" d="M0 0h${width}v${height}H0ZM0 ${height + 2}h${width}" fill="none" stroke="#a3946d" stroke-width="1.5"/>
    <g class="resident-letter" transform="translate(${width + 6} 1)" pointer-events="none"><rect x="-2" y="-2" width="20" height="16" rx="3" fill="#223a36"/><path d="M0 0h16v12H0Zm0 0 8 6 8-6" fill="none" stroke="#e6c795" stroke-width="1.3" stroke-linejoin="round"/></g>
  </g>`);
});
city.push('</svg>');
const cityPalette = { '263b3b': '939d8d', '1c3032': '70817a', '344947': 'aab09b', '243a3b': '96aaa1', '203537': '819b95', '2b4140': 'a4b2a2', '2a4140': '93a997', '2e4140': '99aa9b', '344540': 'a7ad97', '233a37': '808f7d', '41514a': 'bdc1a5', '142a2d': '556f6a', '11282c': '4a6664', '253a3b': '829992', '172b31': '758d87', '203d32': '4b7654', '3c5140': '779465', '152a28': '344d40', '11262b': '819a8f', '0c2127': '6d8781', '455650': 'abb49d', '2b3e3d': '82998c' };
select('#scene').innerHTML = city.join('').replace(/#([0-9a-f]{6})(?![0-9a-f])/gi, (colour, key) => cityPalette[key] ? `var(--city-${key},${colour})` : colour);
const residentButtons = [...document.querySelectorAll('.resident-window')];
const lastResidentIndex = residents.findIndex((resident) => resident.notes.some((note) => note.id === lastResidentNote));
let litResident = lastResidentIndex < 0 ? Math.floor(Math.random() * residents.length) : (lastResidentIndex + 1) % residents.length;
const cityTram = select('#city-tram');
const cityActors = [cityTram, ...document.querySelectorAll('.city-actor')];
let lastCityActor = 0;
let cityLifeTimeout;
let cityLifeTick = 0;
let pageAway = false;
function scenePaused() { return document.hidden || dialog.open || pageAway || world.classList.contains('city-transitioning') || world.classList.contains('radio-travelling'); }
function lightResident(index) {
  litResident = index;
  residentButtons.forEach((button, buttonIndex) => button.classList.toggle('is-lit', buttonIndex === index));
}
lightResident(litResident);
function advanceCityLife() {
  cityLifeTick++;
  lightResident((litResident + 1) % residents.length);
  world.classList.toggle('cat-turned', cityLifeTick % 4 >= 2);
  world.classList.toggle('cat-away', cityLifeTick % 8 === 5 || cityLifeTick % 8 === 6);
  world.classList.toggle('entrance-lit', cityLifeTick % 6 === 1);
  if (!cityActors.some((actor) => actor.classList.contains('is-passing') || actor.classList.contains('tram-passing'))) {
    const next = (lastCityActor + 1) % cityActors.length;
    lastCityActor = next;
    cityActors[next].classList.add(next === 0 ? 'tram-passing' : 'is-passing');
  }
  if (world.dataset.weather === 'storm' && cityLifeTick % 3 === 0) world.classList.add('lightning');
}
select('.weather-lightning').addEventListener('animationend', () => world.classList.remove('lightning'));
cityActors.forEach((actor) => actor.addEventListener('animationend', (event) => {
  if (event.target === actor) actor.classList.remove('tram-passing', 'is-passing');
}));
function scheduleCityLife() {
  clearTimeout(cityLifeTimeout);
  if (scenePaused() || reducedMotion.matches) return;
  cityLifeTimeout = setTimeout(() => { advanceCityLife(); scheduleCityLife(); }, cityLifeTick ? 24000 : 1500);
}

const canvas = select('#rain');
const context = canvas.getContext('2d');
let viewportWidth = 0;
let viewportHeight = 0;
let drops = [];
let rainLevel = 0;
let snowing = false;
let weatherWind = 0;
let lastFrame = null;
let rainFrame;
const rainFrameDuration = 1000 / 30;
let rainColors = ['rgba(177,205,200,.12)', 'rgba(177,205,200,.20)', 'rgba(177,205,200,.29)'];
function resizeRain() {
  viewportWidth = world.clientWidth;
  viewportHeight = world.clientHeight;
  canvas.width = viewportWidth;
  canvas.height = viewportHeight;
  const count = Math.min(250, Math.max(80, Math.round(viewportWidth * viewportHeight / 4200)));
  drops = Array.from({ length: count }, () => ({ x: random() * viewportWidth, y: random() * viewportHeight, length: 9 + random() * 19, speed: 380 + random() * 360, group: Math.floor(random() * 3) }));
  restartRain();
}
function drawRain(timestamp) {
  rainFrame = undefined;
  if (scenePaused() || !rainLevel) return;
  if (lastFrame !== null && timestamp - lastFrame < rainFrameDuration - .1) {
    rainFrame = requestAnimationFrame(drawRain);
    return;
  }
  const delta = lastFrame === null ? 0 : Math.min((timestamp - lastFrame) / 1000, .08);
  lastFrame = timestamp;
  context.clearRect(0, 0, viewportWidth, viewportHeight);
  const count = Math.round(rainLevel * drops.length);
  for (let index = 0; index < count; index++) {
    const drop = drops[index];
    if (!reducedMotion.matches) {
      const speed = snowing ? drop.speed * .07 : drop.speed;
      drop.y += speed * delta;
      drop.x -= speed * delta * (snowing ? .15 + weatherWind / 80 : .18 + weatherWind / 100);
      if (drop.y > viewportHeight + 30) { drop.y = -30; drop.x = random() * (viewportWidth + 200); }
      if (drop.x < -30) drop.x = viewportWidth + 30;
    }
  }
  context.lineWidth = snowing ? 2 : .65;
  context.lineCap = snowing ? 'round' : 'butt';
  for (let group = 0; group < rainColors.length; group++) {
    context.strokeStyle = rainColors[group];
    context.beginPath();
    for (let index = 0; index < count; index++) {
      const drop = drops[index];
      if (drop.group !== group) continue;
      context.moveTo(drop.x, drop.y);
      context.lineTo(drop.x - (snowing ? 0 : drop.length * .24), drop.y + (snowing ? 1 : drop.length));
    }
    context.stroke();
  }
  if (!reducedMotion.matches) rainFrame = requestAnimationFrame(drawRain);
}
function restartRain() {
  cancelAnimationFrame(rainFrame);
  rainFrame = undefined;
  lastFrame = null;
  context.clearRect(0, 0, viewportWidth, viewportHeight);
  if (!scenePaused()) drawRain(0);
}
function syncSceneActivity() {
  world.classList.toggle('scene-paused', scenePaused());
  if (reducedMotion.matches) {
    world.classList.remove('cat-turned', 'cat-away', 'entrance-lit');
    cityTram.classList.remove('tram-passing');
    cityActors.forEach((actor) => actor.classList.remove('is-passing'));
  }
  updateClock();
  restartRain();
  scheduleCityLife();
}
window.addEventListener('resize', resizeRain);
document.addEventListener('visibilitychange', syncSceneActivity);
dialog.addEventListener('close', syncSceneActivity);
reducedMotion.addEventListener('change', syncSceneActivity);
window.addEventListener('pagehide', () => { pageAway = true; syncSceneActivity(); });
window.addEventListener('pageshow', () => { pageAway = false; syncSceneActivity(); });
resizeRain(); scheduleCityLife();

const stations = [
  { name: 'Тихие частоты', description: 'Кафе и мягкий эмбиент', sound: 'cafe', notes: [130.81, 164.81, 196, 246.94], wave: 'sine' },
  { name: 'Последний трамвай', description: 'Стук колёс и ночной путь', sound: 'train', notes: [], wave: 'triangle' },
  { name: 'Между снами', description: 'Море и мягкий прибой', sound: 'waves', notes: [], wave: 'sine' },
  { name: 'Рок-н-ролл', description: '181.FM · Good Time Oldies', stream: 'https://listen.181fm.com/181-goodtime_128k.mp3', notes: [], wave: 'sine' },
  { name: 'Лоу-фай', description: 'FluxFM · Chillhop', stream: 'https://channels.fluxfm.de/chillhop/externalembedflxhp/stream.mp3', fallback: 'https://listen.181fm.com/181-chilled_128k.mp3', fallbackDescription: '181.FM · Chilled — спокойная электроника', notes: [], wave: 'sine' },
  { name: 'Электро', description: 'FluxFM · ElektroFlux', stream: 'https://channels.fluxfm.de/elektro-flux/externalembedflxhp/stream.mp3', fallback: 'https://listen.181fm.com/181-energy98_128k.mp3', fallbackDescription: '181.FM · Energy 98 — танцевальная электроника', notes: [], wave: 'sine' },
  { name: 'Джаз', description: '181.FM · BeBop', stream: 'https://listen.181fm.com/181-bebop_128k.mp3', fallback: 'https://channels.fluxfm.de/x-jazz/externalembedflxhp/stream.mp3', fallbackDescription: 'FluxFM · Xjazz', notes: [], wave: 'sine' },
  { name: 'Блюз', description: '181.FM · True Blues', stream: 'https://listen.181fm.com/181-blues_128k.mp3', notes: [], wave: 'sine' }
];
let audio;
let masterGain;
let musicGain;
let voices = [];
let stationIndex = 0;
let playing = false;
let musicLevel = .45;
let melodyInterval;
let toastTimeout;
let audioBusy = false;
let activeTrack;
let stationRequest = 0;
let pendingTrack;
let stationFailed = false;
let liveStationIndex = 4;
let liveRadioEnabled = false;
let radioFailureMessage = '';
const soundGroups = [
  { id: 'weather', name: 'Погода' },
  { id: 'water', name: 'У воды' },
  { id: 'nature', name: 'Лес и лето' },
  { id: 'home', name: 'Тёплый дом' },
  { id: 'travel', name: 'Люди и дорога' }
];
const layers = [
  { id: 'rain', group: 'weather', name: 'Дождь в саду', detail: 'Капли на листьях и дорожках', duration: 316, icon: 'M7 14a4 4 0 0 1 0-8 5 5 0 0 1 10-1 4 4 0 0 1 1 9M7 18l-1 3m6-3-1 3m6-3-1 3', cutoff: 3200 },
  { id: 'roof', group: 'weather', name: 'Под крышей', detail: 'Дождь снаружи, укрытие внутри', duration: 298, icon: 'm3 10 9-7 9 7M5 9v12h14V9M9 21v-7h6v7M3 3 2 5m19-2-1 2', cutoff: 3500 },
  { id: 'tent', group: 'weather', name: 'В палатке', detail: 'Капли по натянутой ткани', duration: 248, icon: 'm2 21 10-17 10 17H2Zm10-17v17m0-9 5 9M4 3 3 5m17-2-1 2', cutoff: 3000 },
  { id: 'window', group: 'weather', name: 'Мансардное окно', detail: 'Дождливый вечер под стеклом', duration: 826, icon: 'M4 3h16v18H4ZM4 12h16M12 3v18M8 6 6 9m12 6-2 3', cutoff: 3200 },
  { id: 'thunder', group: 'weather', name: 'Гроза', detail: 'Раскаты далёкого грома', duration: 620, icon: 'M7 14a4 4 0 0 1 0-8 5 5 0 0 1 10-1 4 4 0 0 1 1 8M13 12l-4 6h4l-2 5', cutoff: 2000 },
  { id: 'wind', group: 'weather', name: 'Ветер в кронах', detail: 'Деревья в утреннем лесу', duration: 271, icon: 'M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6a3 3 0 1 1-3 3', cutoff: 3200 },
  { id: 'stream', group: 'water', name: 'Ручей', detail: 'Вода журчит рядом с садом', duration: 308, icon: 'M8 3c8 3-8 6 0 9s-8 6 0 9M15 3c8 3-8 6 0 9s-8 6 0 9', cutoff: 5000 },
  { id: 'river', group: 'water', name: 'Горная река', detail: 'Негромкий ровный поток', duration: 191, icon: 'm2 11 5-7 5 7 5-7 5 7M2 16q3-3 6 0t6 0 6 0M2 21q3-3 6 0t6 0 6 0', cutoff: 3800 },
  { id: 'waterfall', group: 'water', name: 'Водопад', detail: 'Сплошная завеса воды', duration: 296, icon: 'M3 5h6v12m4-12v12m4-12v12h4M3 21q3-3 6 0t6 0 6 0', cutoff: 2800 },
  { id: 'waves', group: 'water', name: 'Морской прибой', detail: 'Волны Мексиканского залива', duration: 597, icon: 'M2 10c5 0 4-7 9-7a5 5 0 0 1 4 8c4-1 5 1 7 1M2 16q3-3 6 0t6 0 6 0M2 21q3-3 6 0t6 0 6 0', cutoff: 4400 },
  { id: 'lake', group: 'water', name: 'Берег озера', detail: 'Маленькие волны у кромки', duration: 242, icon: 'M4 7a8 3 0 1 1 16 0 8 3 0 1 1-16 0Zm-1 6q4 4 9 0t9 0M3 19q4 4 9 0t9 0', cutoff: 5000 },
  { id: 'underwater', group: 'water', name: 'Под водой', detail: 'Волны и пузырьки в глубине', duration: 296, icon: 'M2 4q3-3 6 0t6 0 6 0M6 12a2 2 0 1 1 4 0 2 2 0 1 1-4 0Zm8 6a3 3 0 1 1 6 0 3 3 0 1 1-6 0ZM15 9h.01', cutoff: 3000 },
  { id: 'crickets', group: 'nature', name: 'Сверчки', detail: 'Тихая ночь во Флориде', duration: 195, icon: 'M9 9c0-5 6-5 6 0v7c0 5-6 5-6 0ZM9 11 4 8m11 3 5-3M9 15H3m12 0h6M9 18l-4 4m10-4 4 4M10 5 8 2m6 3 2-3', cutoff: 6500 },
  { id: 'birds', group: 'nature', name: 'Лесные птицы', detail: 'Солнечная весенняя опушка', duration: 363, icon: 'M3 15c6 0 5-8 11-8l3 3h4l-4 3c-1 6-8 8-14 2Zm9-8 1-4m1 7h.01M6 19l-2 3m6-2v2', cutoff: 8500 },
  { id: 'meadow', group: 'nature', name: 'Летний луг', detail: 'Солнечный полдень за городом', duration: 360, icon: 'M12 22V11m0 5c-6 0-7-4-7-4 5 0 7 4 7 4Zm0 3c6 0 7-4 7-4-5 0-7 4-7 4ZM9 7a3 3 0 1 1 6 0 3 3 0 1 1-6 0Z', cutoff: 7500 },
  { id: 'frogs', group: 'nature', name: 'Пруд после дождя', detail: 'Ночной хор лягушек', duration: 496, icon: 'M6 10a3 3 0 1 1 5-2h2a3 3 0 1 1 5 2c5 8-17 8-12 0Zm1 9-4 3m14-3 4 3M8 8h.01M16 8h.01M8 13q4 3 8 0', cutoff: 5500 },
  { id: 'jungle', group: 'nature', name: 'Ночь в джунглях', detail: 'Птицы, насекомые и лягушки', duration: 301, icon: 'M12 22V8M3 10c0-10 9-10 9-2 0-8 9-8 9 2-4-3-6-2-9-2-3 0-5-1-9 2Zm3 11 6-6 6 6', cutoff: 7500 },
  { id: 'cicadas', group: 'nature', name: 'Цикады', detail: 'Сверчки и дневное лето', duration: 282, icon: 'M10 7h4v12h-4ZM10 9C0 0 0 18 10 16m4-7c10-9 10 9 0 7M10 7 8 3m6 4 2-4M12 19v3', cutoff: 6500 },
  { id: 'fire', group: 'home', name: 'Камин', detail: 'Потрескивание настоящих дров', duration: 248, icon: 'M13 3c1 5-4 6-2 10 1-1 2-2 2-4 5 4 6 7 3 10-3 3-9 2-10-2-1-4 3-6 7-14Z', cutoff: 5500 },
  { id: 'cat', group: 'home', name: 'Кот рядом', detail: 'Негромкое мурчание', duration: 419, icon: 'm5 11-1-8 7 5h2l7-5-1 8c5 12-19 12-14 0Zm3 2h.01m8 0h.01M10 17l2 1 2-1M3 15H1m20 0h2', cutoff: 1800 },
  { id: 'chimes', group: 'home', name: 'Музыка ветра', detail: 'Подвесные колокольчики', duration: 338, icon: 'M12 2v4M5 8l7-2 7 2M6 9v10m6-11v13m6-12v8M4 19h4m2 2h4m2-4h4', cutoff: 6500 },
  { id: 'clock', group: 'home', name: 'Старые часы', detail: 'Размеренное тиканье', duration: 707, icon: 'M21 12a9 9 0 1 1-18 0 9 9 0 1 1 18 0M12 6v6l4 2M6 4 4 2m14 2 2-2', cutoff: 3500 },
  { id: 'library', group: 'home', name: 'Библиотека', detail: 'Спокойный читальный зал', duration: 238, icon: 'M3 4h5v17H3Zm7-1h5v18h-5Zm7 3 4-1 3 15-4 1ZM3 8h5m2 0h5', cutoff: 4000 },
  { id: 'typing', group: 'home', name: 'За работой', detail: 'Печать на клавиатуре', duration: 296, icon: 'M2 6h20v14H2ZM5 10h1m3 0h1m3 0h1m3 0h1M5 13h1m3 0h1m3 0h1m3 0h1M6 17h12', cutoff: 4500 },
  { id: 'metro', group: 'travel', name: 'Питерское метро', detail: 'Любимая запись синей ветки', duration: 158, icon: 'M7 3h10c2 0 3 2 3 4v10H4V7c0-2 1-4 3-4ZM4 11h16M8 3v8m8-8v8M7 14h1m8 0h1M8 17l-3 5m11-5 3 5M7 20h10', cutoff: 6000 },
  { id: 'train', group: 'travel', name: 'В электричке', detail: 'Из Сергиева Посада в Москву', duration: 369, icon: 'M5 3h14v14H5ZM5 10h14M9 3v7m6-7v7M8 14h.01M16 14h.01M8 17l-3 5m11-5 3 5M7 20h10', cutoff: 4200 },
  { id: 'tram', group: 'travel', name: 'Трамвай', detail: 'Мягкий стук колёс в салоне', duration: 269, icon: 'M6 5h12v13H6ZM6 11h12M12 5V2m-4 0h8M8 18l-2 4m10-4 2 4M9 14h.01M15 14h.01', cutoff: 4000 },
  { id: 'cafe', group: 'travel', name: 'Кофейня', detail: 'Негромкие разговоры и чашки', duration: 292, icon: 'M4 8h12v7a6 6 0 0 1-12 0V8Zm12 1h2a3 3 0 1 1 0 6h-2M3 22h16M7 5V2m5 3V2', cutoff: 4000 },
  { id: 'ferry', group: 'travel', name: 'На пароме', detail: 'Отплытие с открытой палубы', duration: 200, icon: 'm3 14 9-4 9 4-3 5H6l-3-5ZM7 12V6h10v6M12 6V2M2 22q3-3 6 0t6 0 6 0', cutoff: 4000 },
  { id: 'snow', group: 'travel', name: 'Шаги по снегу', detail: 'Неторопливая зимняя прогулка', duration: 312, icon: 'M8 3c-4 0-5 9-2 10 4 2 7-9 2-10Zm-3 13 5 1-1 5-5-1Zm12-9c-4 0-5 9-2 10 4 2 7-9 2-10Zm-3 13 5 1', cutoff: 5000 }
].map((layer) => ({ ...layer, detail: `${layer.detail} · ${Math.floor(layer.duration / 60)}:${String(layer.duration % 60).padStart(2, '0')}`, level: 0, lastLevel: .35, track: null, pending: null, loading: false, failed: false }));
try {
  const saved = JSON.parse(localStorage.getItem('after-rain-mix-v1'));
  if (saved && typeof saved === 'object') {
    if (Number.isFinite(saved.radio)) musicLevel = Math.max(0, Math.min(1, saved.radio));
    if (Number.isInteger(saved.station) && saved.station >= 0 && saved.station < stations.length) stationIndex = saved.station;
    layers.forEach((layer) => {
      const value = saved.layers?.[layer.id];
      if (Number.isFinite(value)) { layer.level = Math.max(0, Math.min(1, value)); if (layer.level) layer.lastLevel = layer.level; }
    });
  }
} catch {}
function saveMix() {
  try { localStorage.setItem('after-rain-mix-v1', JSON.stringify({ radio: musicLevel, station: stationIndex, layers: Object.fromEntries(layers.map((layer) => [layer.id, layer.level])) })); } catch {}
}
function setRangeValue(input, value) {
  input.value = Math.round(value * 100);
  input.style.setProperty('--value', `${input.value}%`);
}
function syncMixer() {
  const selectedLayers = layers.filter((layer) => layer.level > 0);
  const activeCount = selectedLayers.length + (musicLevel > 0 ? 1 : 0);
  select('#sound-status').textContent = !activeCount ? 'Все звуки выключены' : playing ? selectedLayers.length ? `Звуков в миксе: ${activeCount}` : 'Ты на своей волне' : 'Пусть мир подождёт';
  select('#mixer').classList.toggle('has-layers', selectedLayers.length > 0);
  setRangeValue(select('#rain-level'), layers.find((layer) => layer.id === 'rain').level);
  setRangeValue(select('#music-level'), musicLevel);
  layers.forEach((layer) => {
    const row = content.querySelector(`[data-layer-row="${layer.id}"]`);
    if (!row) return;
    row.classList.toggle('enabled', layer.level > 0);
    const toggle = row.querySelector('button');
    toggle.setAttribute('aria-pressed', String(layer.level > 0));
    toggle.setAttribute('aria-label', `${layer.level ? 'Выключить' : 'Включить'}: ${layer.name}`);
    setRangeValue(row.querySelector('input'), layer.level);
    row.querySelector('output').textContent = `${Math.round(layer.level * 100)}%`;
    row.querySelector('.layer-detail').textContent = layer.failed ? 'Не загрузилось — нажми ещё раз' : layer.loading ? 'Загружаю запись…' : layer.detail;
  });
  const radioRow = content.querySelector('[data-radio-row]');
  if (radioRow) {
    radioRow.classList.toggle('enabled', musicLevel > 0);
    radioRow.querySelector('button').setAttribute('aria-pressed', String(musicLevel > 0));
    radioRow.querySelector('button').setAttribute('aria-label', `${musicLevel ? 'Выключить' : 'Включить'}: Ночное радио`);
    setRangeValue(radioRow.querySelector('input'), musicLevel);
    radioRow.querySelector('output').textContent = `${Math.round(musicLevel * 100)}%`;
    radioRow.querySelector('.layer-detail').textContent = stations[stationIndex].name;
  }
  const mixPlay = select('#mix-play');
  if (mixPlay) mixPlay.textContent = playing ? 'Пауза' : 'Слушать микс';
  const feedback = select('#mix-feedback');
  if (feedback) feedback.firstChild.textContent = activeCount ? 'Настройки сохраняются в этом браузере. ' : 'Всё выключено. Начни с одного звука. ';
  select('#station-name').textContent = selectedLayers.length ? 'Свой микс' : stations[stationIndex].name;
  select('.dock-caption').textContent = selectedLayers.length ? 'Твоя атмосфера' : stations[stationIndex].stream ? 'Прямой эфир' : 'Ночные сцены';
  select('#station').setAttribute('aria-label', selectedLayers.length ? 'Открыть свой микс' : 'Сменить радиостанцию');
  syncLiveRadio();
}
function createLayerTrack(layer) {
  const element = document.createElement('audio');
  element.src = `sounds/${layer.id}.mp3?v=2`;
  element.loop = true; element.preload = 'none'; element.hidden = true;
  element.dataset.layerAudio = layer.id;
  document.body.append(element);
  const source = audio.createMediaElementSource(element);
  const filter = audio.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = layer.cutoff;
  const gain = audio.createGain(); gain.gain.value = 0;
  source.connect(filter); filter.connect(gain); gain.connect(masterGain);
  return { element, source, filter, gain };
}
function startLayer(layer) {
  if (!playing || layer.level === 0) return Promise.resolve();
  if (!layer.track) layer.track = createLayerTrack(layer);
  layer.track.gain.gain.setTargetAtTime(layer.level * .7, audio.currentTime, .12);
  if (layer.pending) return layer.pending;
  if (!layer.track.element.paused && !layer.failed) return Promise.resolve();
  layer.loading = true; layer.failed = false; syncMixer();
  if (layer.track.element.error) layer.track.element.load();
  let timeout;
  layer.pending = Promise.race([
    layer.track.element.play(),
    new Promise((resolve, reject) => { timeout = setTimeout(() => reject(new Error('Audio load timeout')), 20000); })
  ]).then(() => {
    if (!playing || layer.level === 0) layer.track.element.pause();
  }).catch(() => {
    if (playing && layer.level > 0) { layer.failed = true; layer.track.element.pause(); toast(`Не удалось загрузить «${layer.name}». Нажми на звук, чтобы повторить.`); }
  }).finally(() => { clearTimeout(timeout); layer.pending = null; layer.loading = false; syncMixer(); });
  return layer.pending;
}
async function setLayerLevel(id, value, updateMix = true) {
  const layer = layers.find((entry) => entry.id === id);
  layer.level = Math.max(0, Math.min(1, value));
  if (layer.level > 0) layer.lastLevel = layer.level;
  if (layer.track && audio) {
    layer.track.gain.gain.setTargetAtTime(layer.level * .7, audio.currentTime, .1);
    if (!layer.level) setTimeout(() => { if (!layer.level) layer.track.element.pause(); }, 400);
  }
  if (updateMix) { saveMix(); syncMixer(); }
  if (layer.level > 0) {
    if (!playing) await toggleAudio();
    startLayer(layer);
  }
}
function setRadioLevel(value, persist = true) {
  musicLevel = Math.max(0, Math.min(1, value));
  if (!musicLevel) {
    liveRadioEnabled = false;
    cancelPendingStation();
    if (activeTrack && stations[activeTrack.index].stream) pauseStation();
  }
  if (audio) {
    musicGain.gain.setTargetAtTime(musicLevel * .8, audio.currentTime, .12);
    if (musicLevel > 0 && playing && !pendingTrack && (!activeTrack || activeTrack.element.paused)) switchStation(stationIndex).catch(() => {});
    if (!musicLevel && activeTrack) {
      const track = activeTrack;
      setTimeout(() => { if (!musicLevel && activeTrack === track) { pauseStation(); syncLiveRadio(); } }, 400);
    }
  }
  if (persist) saveMix();
  syncMixer();
}
function toast(message) {
  select('#toast').textContent = message;
  select('#toast').classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => select('#toast').classList.remove('visible'), 3500);
}
function makeAudio() {
  audio = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audio.createGain(); masterGain.gain.value = 0;
  const compressor = audio.createDynamicsCompressor();
  masterGain.connect(compressor); compressor.connect(audio.destination);
  musicGain = audio.createGain(); musicGain.gain.value = musicLevel * .8; musicGain.connect(masterGain);
  changeChord();
  melodyInterval = setInterval(() => { if (playing) playNote(); }, 3200);
}
function changeChord() {
  if (!audio) return;
  const now = audio.currentTime;
  voices.forEach(({ oscillator, gain }) => {
    gain.gain.cancelScheduledValues(now); gain.gain.setTargetAtTime(0, now, .2); oscillator.stop(now + 1);
  });
  voices = stations[stationIndex].notes.map((frequency, index) => {
    const oscillator = audio.createOscillator(); const gain = audio.createGain();
    oscillator.type = stations[stationIndex].wave; oscillator.frequency.value = frequency / 2;
    oscillator.detune.value = index % 2 ? 4 : -4; gain.gain.value = 0;
    gain.gain.setTargetAtTime(.06, now, 1.5 + index * .3);
    oscillator.connect(gain); gain.connect(musicGain); oscillator.start();
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    return { oscillator, gain };
  });
}
function playNote() {
  if (!playing || musicLevel <= 0 || audio.state !== 'running' || !stations[stationIndex].notes.length) return;
  const now = audio.currentTime;
  const oscillator = audio.createOscillator(); const envelope = audio.createGain();
  const frequencies = stations[stationIndex].notes;
  oscillator.frequency.value = frequencies[Math.floor(Math.random() * frequencies.length)] * (Math.random() > .6 ? 2 : 1);
  oscillator.type = 'sine'; envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(.12, now + .3);
  envelope.gain.exponentialRampToValueAtTime(.001, now + 5);
  oscillator.connect(envelope); envelope.connect(musicGain); oscillator.start(); oscillator.stop(now + 5.1);
  oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); };
}
function disposeTrack(track) {
  if (track.disposed) return;
  track.disposed = true;
  track.element.pause();
  track.element.removeAttribute('src');
  track.element.load();
  track.element.remove();
  track.source.disconnect();
  track.gain.disconnect();
}
function cancelPendingStation() {
  stationRequest++;
  if (pendingTrack) disposeTrack(pendingTrack);
  pendingTrack = null;
}
function pauseStation() {
  if (!activeTrack) return;
  if (stations[activeTrack.index].stream) {
    disposeTrack(activeTrack);
    activeTrack = null;
  } else activeTrack.element.pause();
}
async function switchStation(index) {
  const station = stations[index];
  if (station.stream && !liveRadioEnabled) return false;
  return connectStation(index);
}
async function connectStation(index, useFallback = false) {
  cancelPendingStation();
  const request = ++stationRequest;
  const station = stations[index];
  stationFailed = false;
  radioFailureMessage = '';
  if (!audio) makeAudio();
  if (!station.stream && activeTrack?.index === index && !activeTrack.element.error && !activeTrack.element.ended) {
    const playback = activeTrack.element.play();
    await audio.resume();
    await playback;
    return request === stationRequest;
  }
  const element = document.createElement('audio');
  if (station.stream) element.crossOrigin = 'anonymous';
  element.src = (useFallback ? station.fallback : station.stream) || `sounds/${station.sound}.mp3?v=2`;
  element.loop = !station.stream;
  element.preload = 'none';
  element.hidden = true;
  element.dataset.stationAudio = station.sound || station.name;
  document.body.append(element);
  const source = audio.createMediaElementSource(element);
  const gain = audio.createGain();
  gain.gain.value = 0;
  source.connect(gain); gain.connect(musicGain);
  const track = { element, source, gain, index, description: useFallback ? station.fallbackDescription : station.description };
  pendingTrack = track;
  syncLiveRadio();
  let timeout;
  try {
    const playback = Promise.all([element.play(), audio.resume()]);
    await Promise.race([playback, new Promise((resolve, reject) => { timeout = setTimeout(() => reject(new Error('Audio load timeout')), 12000); })]);
    if (request !== stationRequest) { disposeTrack(track); return false; }
    const now = audio.currentTime;
    if (activeTrack) {
      const previous = activeTrack;
      previous.gain.gain.setTargetAtTime(0, now, .2);
      setTimeout(() => disposeTrack(previous), 1200);
    }
    gain.gain.setTargetAtTime(1, now, .2);
    activeTrack = track;
    stationIndex = index;
    stationFailed = false;
    if (station.stream) liveStationIndex = index;
    select('#station-name').textContent = stations[index].name;
    changeChord();
    saveMix();
    const reportInterruption = () => {
      if (activeTrack !== track || track.disposed) return;
      stationFailed = true;
      liveRadioEnabled = false;
      radioFailureMessage = 'Поток прервался. Нажми «Пуск», чтобы подключиться заново.';
      syncLiveRadio();
      toast(station.stream ? radioFailureMessage : 'Запись прервалась. Выключи и включи звук, чтобы повторить.');
    };
    element.addEventListener('error', reportInterruption);
    if (station.stream) element.addEventListener('ended', reportInterruption);
    return true;
  } catch (error) {
    disposeTrack(track);
    if (request !== stationRequest) return false;
    clearTimeout(timeout);
    if (station.fallback && !useFallback && liveRadioEnabled && error.name !== 'NotAllowedError') return connectStation(index, true);
    stationFailed = true;
    liveRadioEnabled = false;
    radioFailureMessage = error.name === 'NotAllowedError' ? 'Браузер заблокировал звук. Нажми «Пуск» ещё раз.' : 'Поток недоступен в этой сети. Нажми «Пуск», чтобы повторить, или выбери другой жанр.';
    toast(station.stream ? radioFailureMessage : 'Не удалось загрузить запись. Попробуй выбрать волну ещё раз.');
    throw error;
  } finally {
    clearTimeout(timeout);
    if (pendingTrack === track) pendingTrack = null;
    syncMixer();
  }
}
async function toggleAudio() {
  if (audioBusy) { cancelPendingStation(); syncLiveRadio(); return; }
  audioBusy = true;
  try {
    if (!audio) makeAudio();
    if (!playing && musicLevel > 0 && (!stations[stationIndex].stream || liveRadioEnabled) && (!activeTrack || activeTrack.element.paused) && !await switchStation(stationIndex)) return;
    await audio.resume();
    playing = !playing;
    if (!playing) { liveRadioEnabled = false; cancelPendingStation(); }
    masterGain.gain.setTargetAtTime(playing ? .85 : 0, audio.currentTime, .35);
    select('#play').setAttribute('aria-label', playing ? 'Выключить звук' : 'Включить звук');
    select('#play').setAttribute('aria-pressed', String(playing));
    select('#play-path').setAttribute('d', playing ? 'M7 5h4v14H7Zm7 0h4v14h-4Z' : 'm9 5 11 7-11 7Z');
    select('#equalizer').classList.toggle('active', playing);
    select('#sound-status').textContent = playing ? 'Ты на своей волне' : 'Пусть мир подождёт';
    if (playing) layers.forEach((layer) => startLayer(layer));
    else setTimeout(() => {
      if (!playing) {
        layers.forEach((layer) => layer.track?.element.pause());
        if (!pendingTrack) audio.suspend().catch(() => {});
      }
    }, 1200);
    syncMixer();
    if (!playing && activeTrack) {
      const track = activeTrack;
      setTimeout(() => { if (!playing && activeTrack === track) { pauseStation(); syncLiveRadio(); } }, 1200);
    }
  } catch {
    toast('Не удалось включить звук. Попробуй ещё раз.');
  } finally { audioBusy = false; syncLiveRadio(); }
}
select('#play').addEventListener('click', toggleAudio);
select('#rain-level').addEventListener('input', (event) => {
  setLayerLevel('rain', Number(event.target.value) / 100);
});
select('#music-level').addEventListener('input', (event) => {
  setRadioLevel(Number(event.target.value) / 100);
});
document.querySelectorAll('input[type=range]').forEach((input) => {
  const update = () => input.style.setProperty('--value', `${input.value}%`);
  input.addEventListener('input', update); update();
});
select('#wander').addEventListener('click', () => {
  world.classList.add('immersive'); select('#return').hidden = false; select('#return').focus();
  if (!playing) toggleAudio();
});
function leaveCity() { world.classList.remove('immersive'); select('#return').hidden = true; select('#wander').focus(); }
select('#return').addEventListener('click', leaveCity);
const scene = select('#scene');
const citySvg = scene.querySelector('svg');
let explorationAnimation = null;
const explorationHudAnimations = [];
let explorationTarget = null;
let explorationScroll = { left: 0, top: 0 };
const cityHud = document.querySelectorAll('.header, .intro, .city-caption, .sound-dock, .bottom-note, #return, #explore-city');
const explorationSurfaces = [...cityHud, select('#explore-return'), select('#explore-hint')];
function hudFrame(element) {
  const style = getComputedStyle(element);
  const present = element.getClientRects().length > 0;
  const visible = present && style.visibility === 'visible';
  return { opacity: visible ? Number(style.opacity) : 0, transform: style.transform, visible, present };
}
function centerExploration() {
  if (!world.classList.contains('exploring')) return;
  const scale = scene.querySelector('svg').getBoundingClientRect().width / 1600;
  scene.scrollLeft = Math.max(0, 1050 * scale - scene.clientWidth / 2);
  scene.scrollTop = Math.max(0, 470 * scale - scene.clientHeight / 2);
}
function applyExploration(enabled) {
  cityHud.forEach((element) => { element.inert = enabled; });
  world.classList.toggle('exploring', enabled);
  select('#explore-city').setAttribute('aria-expanded', String(enabled));
  select('#explore-return').hidden = false;
  select('#explore-return').inert = !enabled;
  select('#explore-hint').hidden = false;
  scene.tabIndex = enabled ? 0 : -1;
  if (enabled) {
    centerExploration();
    scene.focus({ preventScroll: true });
  } else {
    scene.scrollLeft = 0;
    scene.scrollTop = 0;
    const launcher = select('#explore-city');
    (launcher.getClientRects().length ? launcher : select('#help')).focus({ preventScroll: true });
  }
}
function cityFrame(bounds) {
  const matrix = citySvg.getScreenCTM();
  if (!matrix) return null;
  return {
    transform: `matrix(${matrix.a},${matrix.b},${matrix.c},${matrix.d},${matrix.e - bounds.left},${matrix.f - bounds.top})`,
    opacity: Number(getComputedStyle(scene).opacity) * Number(getComputedStyle(citySvg).opacity)
  };
}
function finishExplorationTransition(target = explorationTarget) {
  if (explorationTarget === null) return;
  explorationTarget = null;
  if (explorationAnimation) {
    explorationAnimation.onfinish = null;
    explorationAnimation.cancel();
    explorationAnimation = null;
  }
  explorationHudAnimations.forEach((animation) => animation.cancel());
  explorationHudAnimations.length = 0;
  world.classList.remove('city-transitioning');
  if (world.classList.contains('exploring') !== target) applyExploration(target);
  else {
    scene.scrollLeft = explorationScroll.left;
    scene.scrollTop = explorationScroll.top;
  }
  world.classList.remove('city-hud-transitioning');
  syncSceneActivity();
}
function setExploration(enabled) {
  if (explorationTarget === null && world.classList.contains('exploring') === enabled) return;
  if (reducedMotion.matches || !document.documentElement.classList.contains('pointer-motion') || !citySvg.animate || !citySvg.getScreenCTM || document.hidden) {
    finishExplorationTransition(enabled);
    if (world.classList.contains('exploring') !== enabled) applyExploration(enabled);
    return;
  }
  if (explorationTarget === enabled) return;
  const bounds = world.getBoundingClientRect();
  const first = cityFrame(bounds);
  const firstHud = explorationSurfaces.map(hudFrame);
  if (explorationAnimation) {
    explorationAnimation.onfinish = null;
    explorationAnimation.cancel();
  }
  explorationHudAnimations.forEach((animation) => animation.cancel());
  explorationHudAnimations.length = 0;
  explorationTarget = enabled;
  world.classList.remove('city-transitioning');
  world.classList.add('city-hud-transitioning');
  applyExploration(enabled);
  const last = cityFrame(bounds);
  const lastHudFrames = explorationSurfaces.map(hudFrame);
  explorationScroll = { left: scene.scrollLeft, top: scene.scrollTop };
  if (!first || !last) { finishExplorationTransition(); return; }
  world.classList.add('city-transitioning');
  scene.scrollLeft = 0;
  scene.scrollTop = 0;
  const timing = { duration: 650, easing: 'cubic-bezier(.37,0,.63,1)', fill: 'both' };
  const startTime = document.timeline?.currentTime;
  const animation = citySvg.animate([first, last], timing);
  if (startTime != null) animation.startTime = startTime;
  explorationAnimation = animation;
  explorationSurfaces.forEach((element, index) => {
    const lastHud = lastHudFrames[index];
    if ((!firstHud[index].visible && !lastHud.visible) || !lastHud.present) return;
    const frames = [
      { opacity: firstHud[index].opacity, visibility: 'visible' },
      { opacity: lastHud.opacity, visibility: 'visible' }
    ];
    const offset = element.classList.contains('header') ? -24 : element.id === 'explore-return' ? 24 : 0;
    if (offset) {
      frames[0].transform = firstHud[index].visible ? firstHud[index].transform : `translateY(${offset}px)`;
      frames[1].transform = lastHud.visible ? lastHud.transform : `translateY(${offset}px)`;
    }
    const hudAnimation = element.animate(frames, timing);
    if (startTime != null) hudAnimation.startTime = startTime;
    explorationHudAnimations.push(hudAnimation);
  });
  animation.onfinish = () => { if (explorationAnimation === animation) finishExplorationTransition(); };
  syncSceneActivity();
}
select('#explore-city').addEventListener('click', () => setExploration(true));
select('#explore-return').addEventListener('click', () => setExploration(false));
scene.addEventListener('pointerdown', () => { if (world.classList.contains('exploring')) select('#explore-hint').hidden = true; }, { passive: true });
window.addEventListener('resize', () => { finishExplorationTransition(); centerExploration(); }, { passive: true });
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { finishExplorationTransition(); finishResidentNoteChange(false); }
  else reserveResidentSpace();
});
window.addEventListener('pagehide', () => { finishExplorationTransition(); finishResidentNoteChange(false); });
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (world.requestFullscreen) await world.requestFullscreen();
    else toast('Полный экран недоступен в этом браузере.');
  } catch { toast('Полный экран недоступен в этом окне.'); }
}
select('#fullscreen').addEventListener('click', toggleFullscreen);
document.addEventListener('fullscreenchange', () => select('#fullscreen').setAttribute('aria-label', document.fullscreenElement ? 'Выйти из полного экрана' : 'На весь экран'));

let timerRemaining = 25 * 60;
let timerDeadline = 0;
let timerRunning = false;
function updateTimer() {
  if (timerRunning) {
    timerRemaining = Math.max(0, Math.ceil((timerDeadline - Date.now()) / 1000));
    if (timerRemaining === 0) {
      timerRunning = false;
      toast('25 минут для себя. Теперь можно отдохнуть.');
      if (playing) playNote();
    }
  }
  const timerDisplay = select('#timer-display');
  if (timerDisplay) {
    timerDisplay.textContent = `${String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:${String(timerRemaining % 60).padStart(2, '0')}`;
    select('#timer-toggle').textContent = timerRunning ? 'Пауза' : timerRemaining === 0 ? 'Ещё 25 минут' : timerRemaining < 1500 ? 'Продолжить' : 'Начать';
  }
  document.title = timerRunning ? `${String(Math.floor(timerRemaining / 60)).padStart(2, '0')}:${String(timerRemaining % 60).padStart(2, '0')} — После дождя` : 'После дождя — место, где можно выдохнуть';
}
setInterval(updateTimer, 1000);
function radioRoom() {
  content.innerHTML = `<nav class="sound-tabs" aria-label="Настройки звука"><button class="current" aria-current="page">Сцены</button><button id="to-live-radio">Эфир</button><button id="to-mixer">Свой микс</button></nav><h2 id="room-title">У каждого своя волна</h2><p>Гул кафе, стук колёс или море за окном. Выбери место, в котором хочется остаться.</p><div class="station-list">${stations.map((station, index) => ({ ...station, index })).filter((station) => !station.stream).map((station) => `<button class="station-choice ${station.index === stationIndex ? 'selected' : ''}" data-station="${station.index}" aria-pressed="${station.index === stationIndex}">${station.name}<span>${station.description}</span></button>`).join('')}</div><p>Добавь камин, ветер или метро во вкладке «Свой микс».<br><a href="sounds/credits.html" target="_blank" rel="noopener">Звуки и авторы ${svgIcon('external')}</a></p><button class="dialog-action" id="radio-toggle">${playing ? 'Выключить звук' : 'Включить звук'}</button>`;
  select('#to-mixer').addEventListener('click', () => openRoom('mixer'));
  select('#to-live-radio').addEventListener('click', () => openRoom('live-radio'));
  content.querySelectorAll('[data-station]').forEach((button) => button.addEventListener('click', async () => {
    const index = Number(button.dataset.station);
    button.setAttribute('aria-busy', 'true');
    button.querySelector('span').textContent = 'Загружаю запись…';
    try {
      const changed = await switchStation(index);
      if (changed && !musicLevel) setRadioLevel(.45);
      if (changed && !playing) await toggleAudio();
    } catch {
      return;
    } finally {
      if (dialog.open && content.querySelector('#radio-toggle')) {
        radioRoom(); content.querySelector(`[data-station="${index}"]`)?.focus();
      }
    }
  }));
  select('#radio-toggle').addEventListener('click', async () => { await toggleAudio(); const button = select('#radio-toggle'); if (button) button.textContent = playing ? 'Выключить звук' : 'Включить звук'; });
}
function syncLiveRadio() {
  const status = select('#live-radio-status');
  if (!status) return;
  const connecting = pendingTrack?.index === liveStationIndex;
  const current = stationIndex === liveStationIndex && playing && musicLevel > 0 && liveRadioEnabled;
  const station = stations[liveStationIndex];
  const provider = current ? activeTrack?.description || station.description : station.description;
  status.textContent = connecting ? `Подключаю ${station.name.toLowerCase()}…` : stationFailed ? radioFailureMessage : current ? `В эфире: ${provider}` : 'Выбери жанр и нажми «Пуск». Ручка громкости не запускает эфир.';
  content.querySelectorAll('[data-live-station]').forEach((button) => {
    const index = Number(button.dataset.liveStation);
    button.classList.toggle('selected', index === liveStationIndex);
    button.setAttribute('aria-pressed', String(index === liveStationIndex));
    button.setAttribute('aria-busy', String(pendingTrack?.index === index));
  });
  const button = select('#live-radio-toggle');
  const actionLabel = connecting ? 'Отмена' : current ? 'Стоп' : 'Пуск';
  const playLabel = select('#receiver-play-label');
  if (playLabel) playLabel.textContent = actionLabel;
  else button.textContent = actionLabel;
  button.setAttribute('aria-label', actionLabel);
  const receiver = select('#radio-receiver');
  if (receiver) {
    const position = stations.filter((entry) => entry.stream).indexOf(station);
    receiver.dataset.genre = ['oldies', 'lofi', 'electro', 'jazz', 'blues'][position];
    receiver.dataset.playing = String(current && !connecting && !stationFailed);
    select('#receiver-station').textContent = station.name;
    select('#receiver-provider').textContent = provider;
    select('#receiver-signal').textContent = connecting ? 'Подключение' : stationFailed ? 'Нет сигнала' : current ? 'В эфире' : 'Готов к эфиру';
    select('#radio-needle').setAttribute('transform', `translate(${36 + position * 122} 0)`);
    select('#receiver-play-icon').setAttribute('d', current && !connecting && !stationFailed ? 'M8 6h3v12H8Zm6 0h3v12h-3Z' : 'm9 5 10 7-10 7Z');
    setRangeValue(select('#receiver-volume'), musicLevel);
    select('#receiver-volume-value').textContent = `${Math.round(musicLevel * 100)}%`;
    select('#receiver-knob-indicator').setAttribute('transform', `rotate(${-135 + musicLevel * 270} 40 40)`);
    select('.receiver-knob').setAttribute('aria-valuenow', String(Math.round(musicLevel * 100)));
    select('.receiver-knob').setAttribute('aria-valuetext', `${Math.round(musicLevel * 100)}%`);
  }
}
function chooseLiveStation(index) {
  liveRadioEnabled = false;
  cancelPendingStation();
  pauseStation();
  stationIndex = liveStationIndex = index;
  stationFailed = false;
  radioFailureMessage = '';
  changeChord();
  saveMix();
  syncMixer();
}
async function playLiveStation(index) {
  liveRadioEnabled = true;
  liveStationIndex = index;
  try {
    const changed = await switchStation(index);
    if (!changed) return;
    if (!musicLevel) setRadioLevel(.45);
    if (!playing) await toggleAudio();
  } catch {} finally { syncMixer(); }
}
function bindReceiverKnob() {
  const knob = select('.receiver-knob');
  let drag = null;
  const angleAt = (event) => Math.atan2(event.clientX - drag.x, drag.y - event.clientY) * 180 / Math.PI;
  const release = () => { if (drag) saveMix(); drag = null; };
  knob.addEventListener('pointerdown', (event) => {
    if (!event.isPrimary || event.button !== 0) return;
    const bounds = knob.getBoundingClientRect();
    drag = { pointerId: event.pointerId, x: bounds.left + bounds.width / 2, y: bounds.top + bounds.height / 2, value: musicLevel, angle: 0 };
    drag.angle = angleAt(event);
    knob.setPointerCapture(event.pointerId);
    knob.focus({ preventScroll: true });
    event.preventDefault();
  });
  knob.addEventListener('pointermove', (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const angle = angleAt(event);
    const delta = (angle - drag.angle + 540) % 360 - 180;
    drag.value = Math.max(0, Math.min(1, drag.value + delta / 270));
    drag.angle = angle;
    setRadioLevel(drag.value, false);
  });
  knob.addEventListener('pointerup', release);
  knob.addEventListener('pointercancel', release);
  knob.addEventListener('lostpointercapture', release);
  knob.addEventListener('keydown', (event) => {
    const values = { ArrowUp: musicLevel + .02, ArrowRight: musicLevel + .02, ArrowDown: musicLevel - .02, ArrowLeft: musicLevel - .02, PageUp: musicLevel + .1, PageDown: musicLevel - .1, Home: 0, End: 1 };
    if (!Object.hasOwn(values, event.key)) return;
    event.preventDefault();
    setRadioLevel(values[event.key]);
  });
}
let radioTravel = null;
const radioTravelAnimations = [];
function finishRadioTravel() {
  if (!radioTravel) return;
  const previous = radioTravel;
  radioTravel = null;
  radioTravelAnimations.forEach((animation) => { animation.onfinish = null; animation.cancel(); });
  radioTravelAnimations.length = 0;
  world.classList.remove('radio-travelling');
  if (!previous.entering && dialog.open && dialog.classList.contains('radio-dialog')) dialog.close();
  if (dialog.open && dialog.classList.contains('radio-dialog')) world.classList.add('radio-room-covered');
  else world.classList.remove('radio-room-active', 'radio-room-covered');
  syncSceneActivity();
}
function startRadioTravel(entering, firstFrame = null) {
  finishRadioTravel();
  world.classList.toggle('radio-room-active', entering);
  world.classList.remove('radio-room-covered');
  if (reducedMotion.matches || !document.documentElement.classList.contains('pointer-motion') || !dialog.animate || document.hidden) {
    if (!entering && dialog.open) dialog.close();
    world.classList.toggle('radio-room-covered', entering);
    syncSceneActivity();
    return;
  }
  radioTravel = { entering };
  const current = radioTravel;
  world.classList.add('radio-travelling');
  const timing = { duration: 300, easing: 'cubic-bezier(.23,1,.32,1)', fill: 'both' };
  const animation = dialog.animate([{ opacity: firstFrame?.opacity ?? (entering ? 0 : 1) }, { opacity: entering ? 1 : 0 }], timing);
  radioTravelAnimations.push(animation);
  animation.onfinish = () => { if (radioTravel === current) finishRadioTravel(); };
  syncSceneActivity();
}
function leaveRadioRoom(animate = true) {
  if (!dialog.open || radioTravel?.entering === false) return;
  const first = radioTravel ? { opacity: Number(getComputedStyle(dialog).opacity) } : null;
  finishRadioTravel();
  world.classList.remove('radio-room-active', 'radio-room-covered');
  if (animate) startRadioTravel(false, first);
  else { dialog.close(); syncSceneActivity(); }
}
window.addEventListener('resize', finishRadioTravel, { passive: true });
document.addEventListener('visibilitychange', () => { if (document.hidden) finishRadioTravel(); });
window.addEventListener('pagehide', finishRadioTravel);
dialog.addEventListener('close', () => { if (!radioTravel) world.classList.remove('radio-room-active', 'radio-room-covered'); });
dialog.addEventListener('cancel', (event) => {
  if (!dialog.classList.contains('radio-dialog')) return;
  event.preventDefault();
  leaveRadioRoom(false);
});
function liveRadioRoom() {
  if (pendingTrack && stations[pendingTrack.index].stream) liveStationIndex = pendingTrack.index;
  else if (stations[stationIndex].stream) liveStationIndex = stationIndex;
  if (content.querySelector('#radio-receiver')) { dialog.scrollTop = 0; syncLiveRadio(); return; }
  content.innerHTML = `<section class="radio-room" aria-labelledby="room-title">
    <svg class="radio-room-light" viewBox="0 0 1400 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><path d="M840-30h520v930H840Z" fill="#b7c3a2" opacity=".025"/><path d="M1010 0v900M840 240h520M840 560h520" stroke="#c9d0ad" stroke-opacity=".05" stroke-width="3"/><ellipse cx="610" cy="800" rx="490" ry="70" fill="#070f12" opacity=".3"/></svg>
    <header class="radio-room-header"><button class="radio-back" id="radio-back">${svgIcon('back')} Вернуться в город</button><h2 id="room-title">Музыка не спит</h2><button class="radio-mix-link" id="receiver-mixer">${svgIcon('mixer')} Свой микс</button></header>
    <div class="radio-room-stage">
      <div class="radio-receiver" id="radio-receiver" data-genre="lofi">
        <svg class="receiver-case" viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="receiver-wood" x2="0" y2="1"><stop stop-color="#75624c"/><stop offset=".55" stop-color="#544b3b"/><stop offset="1" stop-color="#3d392f"/></linearGradient><linearGradient id="receiver-metal" x2="0" y2="1"><stop stop-color="#c0b28f"/><stop offset="1" stop-color="#8b8469"/></linearGradient></defs><rect x="64" y="570" width="120" height="24" rx="6" fill="#172422"/><rect x="816" y="570" width="120" height="24" rx="6" fill="#172422"/><rect x="2" y="2" width="996" height="576" rx="36" fill="url(#receiver-wood)" stroke="#9a8867" stroke-width="2"/><rect x="24" y="24" width="952" height="530" rx="23" fill="url(#receiver-metal)"/><path d="M44 48h912M44 530h912" stroke="#e1d2ad" stroke-opacity=".3"/><circle cx="45" cy="45" r="3" fill="#68664f"/><circle cx="955" cy="45" r="3" fill="#68664f"/><circle cx="45" cy="532" r="3" fill="#68664f"/><circle cx="955" cy="532" r="3" fill="#68664f"/></svg>
        <div class="receiver-speaker" aria-hidden="true"><svg viewBox="0 0 420 420"><defs><pattern id="receiver-grille" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#34463c"/><circle cx="4" cy="4" r="2" fill="#142a25"/></pattern></defs><circle cx="210" cy="210" r="198" fill="#74745a"/><circle cx="210" cy="210" r="190" fill="url(#receiver-grille)" stroke="#c6ba94" stroke-width="2"/><circle cx="210" cy="210" r="156" fill="none" stroke="#8c9576" stroke-opacity=".25"/><circle cx="210" cy="210" r="90" fill="#243a31" fill-opacity=".3"/><path d="M175 210h70m-35-35v70" stroke="#b4b48d" stroke-opacity=".15"/></svg><span>после дождя</span></div>
        <div class="receiver-console">
          <div class="receiver-display"><div class="receiver-display-top"><span>Городское радио</span><span class="receiver-signal"><svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="3"/></svg><span id="receiver-signal">Готов к эфиру</span></span></div><p id="receiver-station">Лоу-фай</p><p id="receiver-provider">FluxFM · Chillhop</p>
            <svg class="receiver-tuner" viewBox="0 0 560 56" aria-hidden="true"><defs><pattern id="receiver-ticks" width="12.2" height="38" patternUnits="userSpaceOnUse"><path d="M0 13v17" stroke="currentColor" stroke-width="1"/></pattern></defs><path d="M8 38h544" stroke="currentColor" stroke-opacity=".45"/><rect x="8" y="0" width="544" height="38" fill="url(#receiver-ticks)" opacity=".55"/><g id="radio-needle" transform="translate(158 0)"><path d="M0 0v45" stroke="currentColor" stroke-width="3"/><path d="m-5 0 5 7 5-7" fill="currentColor"/></g></svg>
          </div>
          <div class="receiver-controls"><div class="receiver-transport"><button class="receiver-step" id="receiver-prev" aria-label="Предыдущая станция"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5v14m12-14L8 12l10 7Z"/></svg></button><button class="receiver-power" id="live-radio-toggle" aria-label="Пуск"><svg viewBox="0 0 24 24" aria-hidden="true"><path id="receiver-play-icon" d="m9 5 10 7-10 7Z"/></svg><span id="receiver-play-label">Пуск</span></button><button class="receiver-step" id="receiver-next" aria-label="Следующая станция"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5v14M6 5l10 7-10 7Z"/></svg></button></div>
          <div class="receiver-volume"><svg class="receiver-knob" viewBox="0 0 80 80" role="slider" tabindex="0" aria-label="Круглая ручка громкости радио" aria-valuemin="0" aria-valuemax="100" aria-valuenow="45"><circle cx="40" cy="40" r="37" fill="#62654f" stroke="#d4c6a3"/><circle cx="40" cy="40" r="30" fill="#bdb18e" stroke="#70735b"/><path id="receiver-knob-indicator" d="M40 14v9" stroke="#233c32" stroke-width="3" stroke-linecap="round"/></svg><span>Громкость <output id="receiver-volume-value" for="receiver-volume">45%</output></span><input id="receiver-volume" type="range" min="0" max="100" value="45" aria-label="Громкость радио в радиокомнате"></div></div>
        </div>
        <nav class="receiver-stations" aria-label="Выбрать жанр радио">${stations.map((station, index) => station.stream ? `<button class="receiver-preset" data-live-station="${index}" aria-pressed="false"><svg viewBox="0 0 12 12" aria-hidden="true"><circle cx="6" cy="6" r="3"/></svg><span>${station.name}</span></button>` : '').join('')}</nav>
      </div>
      <p class="live-radio-status receiver-status" id="live-radio-status" role="status" aria-atomic="true"></p>
    </div>
    <footer class="radio-room-footer"><p>Настройся на свою волну<br><span>Эфир продолжится, даже если вернёшься в город.</span></p><details class="receiver-sources"><summary>Об эфире и станциях</summary><p>Рок-н-ролл и олдиз 50–60-х — Good Time Oldies; лоу-фай — Chillhop; джаз — BeBop. Станции: <a href="https://181.fm/" target="_blank" rel="noopener noreferrer">181.FM ${svgIcon('external')}</a> и <a href="https://www.fluxfm.de/flux-musik-streams" target="_blank" rel="noopener noreferrer">FluxFM ${svgIcon('external')}</a>. Подключение только по «Пуск». Если основной поток недоступен, у лоу-фая, электро и джаза есть один резервный эфир. У лоу-фая резерв — Chilled, спокойная электроника вместо chillhop. В эфире возможны реклама, джинглы и перебои. Интернет и мобильный трафик расходуются во время воспроизведения.</p></details></footer>
  </section>`;
  select('#radio-back').addEventListener('click', () => leaveRadioRoom());
  select('#receiver-mixer').addEventListener('click', () => openRoom('mixer'));
  content.querySelectorAll('[data-live-station]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.liveStation);
    chooseLiveStation(index);
  }));
  const stepStation = (direction) => {
    const indices = stations.map((station, index) => station.stream ? index : -1).filter((index) => index >= 0);
    chooseLiveStation(indices[(indices.indexOf(liveStationIndex) + direction + indices.length) % indices.length]);
  };
  select('#receiver-prev').addEventListener('click', () => stepStation(-1));
  select('#receiver-next').addEventListener('click', () => stepStation(1));
  select('#receiver-volume').addEventListener('input', (event) => setRadioLevel(Number(event.target.value) / 100));
  bindReceiverKnob();
  select('#live-radio-toggle').addEventListener('click', () => {
    if (pendingTrack?.index === liveStationIndex || (liveRadioEnabled && playing && musicLevel > 0 && stationIndex === liveStationIndex)) { liveRadioEnabled = false; cancelPendingStation(); pauseStation(); syncMixer(); }
    else playLiveStation(liveStationIndex);
  });
  dialog.scrollTop = 0;
  if (dialog.open) select('#radio-back').focus({ preventScroll: true });
  syncLiveRadio();
}
function mixerRoom() {
  const groups = soundGroups.map((group) => `<section class="mixer-group" data-sound-group="${group.id}" aria-labelledby="sound-group-${group.id}"><h3 id="sound-group-${group.id}">${group.name}</h3>${layers.filter((layer) => layer.group === group.id).map((layer) => `<div class="layer-row" data-layer-row="${layer.id}"><button class="layer-toggle" aria-label="Включить: ${layer.name}" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${layer.icon}"/></svg></button><div class="layer-copy"><span class="layer-name">${layer.name}</span><span class="layer-detail">${layer.detail}</span></div><input type="range" min="0" max="100" value="0" aria-label="Громкость: ${layer.name}"><output>0%</output></div>`).join('')}</section>`).join('');
  content.innerHTML = `<nav class="sound-tabs" aria-label="Настройки звука"><button id="to-radio">Сцены</button><button id="to-live-radio">Эфир</button><button class="current" aria-current="page">Свой микс</button></nav><h2 id="room-title">Собери своё место</h2><p class="mixer-intro">30 звуков на пять тем.<br>Смешивай и находи свой баланс.</p><label class="mixer-filter"><span>Тема</span><select id="sound-theme"><option value="all">Все темы · 30 звуков</option>${soundGroups.map((group) => `<option value="${group.id}">${group.name} · 6 звуков</option>`).join('')}</select><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg></label><div class="mixer-list">${groups}<div class="layer-row radio-layer" data-radio-row><button class="layer-toggle" aria-label="Выключить: Ночное радио" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16v12H4ZM7 8l10-5M8 12v4m-2-2h4m4-2h3m-3 4h3"/></svg></button><div class="layer-copy"><span class="layer-name">Ночное радио</span><span class="layer-detail">${stations[stationIndex].name}</span></div><input type="range" min="0" max="100" value="45" aria-label="Громкость: Ночное радио"><output>45%</output></div></div><div class="mix-actions"><button class="dialog-action" id="mix-play">Слушать микс</button><button class="mix-clear" id="mix-clear">Выключить всё</button></div><p class="mix-footnote" id="mix-feedback" role="status">Настройки сохраняются в этом браузере. <a href="sounds/credits.html" target="_blank" rel="noopener">Звуки и авторы ${svgIcon('external')}</a></p>`;
  select('#to-radio').addEventListener('click', () => openRoom('radio'));
  select('#to-live-radio').addEventListener('click', () => openRoom('live-radio'));
  select('#sound-theme').addEventListener('change', (event) => {
    content.querySelectorAll('[data-sound-group]').forEach((group) => { group.hidden = event.target.value !== 'all' && group.dataset.soundGroup !== event.target.value; });
    select('.mixer-list').scrollTop = 0;
  });
  layers.forEach((layer) => {
    const row = content.querySelector(`[data-layer-row="${layer.id}"]`);
    row.querySelector('button').addEventListener('click', () => setLayerLevel(layer.id, layer.failed ? layer.level : layer.level > 0 ? 0 : layer.lastLevel));
    row.querySelector('input').addEventListener('input', (event) => setLayerLevel(layer.id, Number(event.target.value) / 100));
  });
  const radioRow = content.querySelector('[data-radio-row]');
  radioRow.querySelector('button').addEventListener('click', async () => { setRadioLevel(musicLevel > 0 ? 0 : .45); if (musicLevel > 0 && !playing) await toggleAudio(); });
  radioRow.querySelector('input').addEventListener('input', async (event) => { setRadioLevel(Number(event.target.value) / 100); if (musicLevel > 0 && !playing) await toggleAudio(); });
  select('#mix-play').addEventListener('click', toggleAudio);
  select('#mix-clear').addEventListener('click', async () => {
    layers.forEach((layer) => setLayerLevel(layer.id, 0, false));
    setRadioLevel(0);
    if (playing) await toggleAudio();
  });
  syncMixer();
}
function commitResidentNote(change) {
  if (!change || change !== residentNoteChange || change.committed || !dialog.open || !content.contains(change.body)) return;
  const note = chooseResidentNote(change.index);
  change.title.textContent = note.title;
  change.body.textContent = note.text;
  if (change.nextResident) {
    const resident = residents[change.index];
    select('.resident-object').setAttribute('d', resident.object);
    select('.resident-signature strong').textContent = resident.name;
    select('.resident-signature span').textContent = resident.place;
    lightResident(change.index);
  }
  change.committed = true;
}
function finishResidentNoteChange(commit = true) {
  const change = residentNoteChange;
  if (!change) return;
  if (commit) commitResidentNote(change);
  residentNoteChange = null;
  content.classList.remove('changing-note', 'changing-resident');
  change.button.removeAttribute('aria-busy');
}
function changeResidentNote(index, nextResident = false) {
  if (residentNoteChange) return;
  residentNoteChange = { index, nextResident, title: select('#room-title'), body: select('.resident-note'), button: select(nextResident ? '#resident-next' : '#resident-more'), committed: false };
  if (reducedMotion.matches || !document.documentElement.classList.contains('pointer-motion') || !residentNoteChange.body.animate) {
    finishResidentNoteChange();
    return;
  }
  residentNoteChange.button.setAttribute('aria-busy', 'true');
  if (nextResident) content.classList.add('changing-resident');
  content.classList.add('changing-note');
}
function reserveResidentSpace(retry = true) {
  if (!dialog.open || !dialog.classList.contains('resident-dialog') || document.hidden) return;
  finishResidentNoteChange();
  const title = select('#room-title');
  const body = select('.resident-note');
  const signature = select('.resident-signature');
  const elements = [title, body, signature];
  const styles = elements.map((element) => getComputedStyle(element));
  const widths = styles.map((style) => style.width);
  const key = styles.flatMap((style) => [style.width, style.font]).join('|');
  if (residentSizeKey === key) return;
  const probe = document.createElement('div');
  probe.className = 'resident-measure';
  probe.setAttribute('aria-hidden', 'true');
  probe.inert = true;
  const stacks = elements.map(() => document.createElement('div'));
  function addSample(element, column) {
    const sample = element.cloneNode(column === 2);
    sample.removeAttribute('id');
    sample.removeAttribute('aria-live');
    sample.removeAttribute('aria-atomic');
    sample.style.cssText = `grid-area:1 / 1;min-height:0;height:auto;margin:0;width:${widths[column]}`;
    stacks[column].append(sample);
    return sample;
  }
  residents.forEach((resident) => {
    resident.notes.forEach((note) => {
      addSample(title, 0).textContent = note.title;
      addSample(body, 1).textContent = note.text;
    });
    const sample = addSample(signature, 2);
    sample.querySelector('strong').textContent = resident.name;
    sample.querySelector('span').textContent = resident.place;
  });
  probe.append(...stacks);
  content.append(probe);
  const heights = stacks.map((stack) => stack.offsetHeight + 1);
  probe.remove();
  elements.forEach((element, column) => { element.style.minHeight = `${heights[column]}px`; });
  residentSizeKey = key;
  if (retry && elements.some((element, column) => getComputedStyle(element).width !== widths[column])) reserveResidentSpace(false);
}
function residentRoom(index) {
  finishResidentNoteChange(false);
  residentSizeKey = '';
  const resident = residents[index];
  const note = chooseResidentNote(index);
  lightResident(index);
  content.innerHTML = `<span class="room-eyebrow">Жизнь в окнах</span><h2 id="room-title">${note.title}</h2>
    <svg class="resident-illustration" viewBox="0 0 240 120" fill="none" aria-hidden="true">
      <path d="M38 99h164M49 18h142v81H49Z" stroke="#789183" stroke-opacity=".45"/>
      <path d="M51 20h138v77H51Z" fill="#d5ad6e" fill-opacity=".1"/>
      <path d="M51 20h24l-8 77H51Zm138 0h-20l8 77h12Z" fill="#83917b" fill-opacity=".25"/>
      <ellipse cx="137" cy="72" rx="44" ry="28" fill="url(#resident-glow)"/>
      <path d="M116 65h40l-10-23h-20Z" fill="#e5c28c"/><path d="M136 65v25m-12 0h24M91 93h77" stroke="#b1a080" stroke-width="2"/>
      <path class="resident-object" d="${resident.object}" stroke="#d7bf95" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" transform="translate(20 0)"/>
      <defs><radialGradient id="resident-glow"><stop stop-color="#e5c28c" stop-opacity=".25"/><stop offset="1" stop-color="#e5c28c" stop-opacity="0"/></radialGradient></defs>
    </svg>
    <blockquote class="resident-note" aria-live="polite" aria-atomic="true">${note.text}</blockquote><p class="resident-signature"><strong>${resident.name}</strong><span>${resident.place}</span></p>
    <div class="resident-actions"><button class="dialog-action" id="resident-more">Ещё записка ${svgIcon('notes')}</button><button class="dialog-action secondary" id="resident-next">Другое окно ${svgIcon('external')}</button><button class="mix-clear" id="resident-return">Вернуться в город</button></div>`;
  select('#resident-more').addEventListener('click', () => changeResidentNote(litResident));
  select('.resident-note').addEventListener('animationiteration', (event) => {
    if (event.animationName === 'resident-note-swap' && residentNoteChange?.body === event.currentTarget) commitResidentNote(residentNoteChange);
  });
  select('.resident-note').addEventListener('animationend', (event) => {
    if (event.animationName === 'resident-note-swap' && residentNoteChange?.body === event.currentTarget) finishResidentNoteChange(false);
  });
  select('#resident-next').addEventListener('click', () => changeResidentNote((litResident + 1) % residents.length, true));
  select('#resident-return').addEventListener('click', () => dialog.close());
  if (dialog.open) { reserveResidentSpace(); revealContent(content); }
}
function openRoom(room) {
  const wasOpen = dialog.open;
  if (room !== 'live-radio') {
    finishRadioTravel();
    world.classList.remove('radio-room-active', 'radio-room-covered');
  }
  finishResidentNoteChange(false);
  finishExplorationTransition();
  dialog.classList.toggle('mixer-dialog', room === 'mixer');
  dialog.classList.toggle('resident-dialog', room === 'resident');
  dialog.classList.toggle('radio-dialog', room === 'live-radio');
  if (room === 'radio') radioRoom();
  if (room === 'live-radio') liveRadioRoom();
  if (room === 'weather') weatherRoom();
  if (room === 'cities') cityRoom();
  if (room === 'mixer') mixerRoom();
  if (room === 'resident') residentRoom(litResident);
  if (room === 'notes') {
    content.innerHTML = `<span class="room-eyebrow">Окно на четвёртом</span><h2 id="room-title">Оставь это здесь</h2><p>Мысль, которая не даёт уснуть. Идею на завтра. Или пару слов самому себе.</p><label for="notes" class="saved-label">Твои заметки</label><textarea id="notes" placeholder="О чём ты сейчас думаешь?"></textarea><span class="saved-label" id="save-status" role="status">Только в этом браузере. Только для тебя.</span>`;
    try { select('#notes').value = localStorage.getItem('after-rain-notes') || ''; } catch { select('#save-status').textContent = 'Хранилище недоступно. Скопируй заметку перед закрытием.'; }
    select('#notes').addEventListener('input', (event) => {
      try { localStorage.setItem('after-rain-notes', event.target.value); select('#save-status').textContent = 'Сохранено. Можно отпустить.'; }
      catch { select('#save-status').textContent = 'Не удалось сохранить. Скопируй текст перед закрытием.'; }
    });
  }
  if (room === 'focus') {
    content.innerHTML = `<span class="room-eyebrow">Тихая комната</span><h2 id="room-title">Одно дело. Без суеты</h2><p>Двадцать пять минут для того, что важно сейчас. Остальное подождёт за дверью.</p><div class="timer-display" id="timer-display" role="timer" aria-label="Оставшееся время">25:00</div><button class="dialog-action" id="timer-toggle">Начать</button><button class="dialog-action secondary" id="timer-reset">Сначала</button><p>Можешь закрыть окно — время продолжит идти.</p>`;
    select('#timer-toggle').addEventListener('click', () => {
      if (timerRunning) { updateTimer(); timerRunning = false; }
      else { if (!timerRemaining) timerRemaining = 1500; timerDeadline = Date.now() + timerRemaining * 1000; timerRunning = true; }
      updateTimer();
    });
    select('#timer-reset').addEventListener('click', () => { timerRunning = false; timerRemaining = 1500; updateTimer(); });
    updateTimer();
  }
  if (room === 'help') {
    content.innerHTML = `<span class="room-eyebrow">Добро пожаловать в квартал</span><h2 id="room-title">Здесь можно выдохнуть</h2><p>Нажми на светящуюся метку в городе. В кафе — три звуковые сцены. Под меткой «Радио» — пять музыкальных эфиров. В окне с карандашом — место для мыслей. Под часами — 25 минут тишины для одного дела.</p><p>Ползунки внизу меняют дождь и музыку. «Побыть здесь» убирает заголовок и включает звук.</p><div class="help-keys"><span><kbd>M</kbd>звук</span><span><kbd>F</kbd>весь экран</span><span><kbd>Esc</kbd>назад</span></div>`;
  }
  if (!dialog.open) {
    dialog.showModal();
    if (room === 'resident') reserveResidentSpace();
  }
  else if (room !== 'resident' && room !== 'live-radio') revealContent(content);
  if (room === 'live-radio') {
    if (!wasOpen) startRadioTravel(true);
    else world.classList.add('radio-room-active', 'radio-room-covered');
  }
  syncSceneActivity();
}
document.querySelectorAll('.city-place').forEach((place) => {
  place.addEventListener('click', () => openRoom(place.dataset.room));
  place.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openRoom(place.dataset.room); } });
});
residentButtons.forEach((button, index) => {
  const openResident = () => { lightResident(index); openRoom('resident'); };
  button.addEventListener('click', openResident);
  button.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openResident(); }
  });
});
select('#meet-resident').addEventListener('click', () => openRoom('resident'));
select('#station').addEventListener('click', () => openRoom(layers.some((layer) => layer.level > 0) ? 'mixer' : stations[stationIndex].stream ? 'live-radio' : 'radio'));
select('#mixer').addEventListener('click', () => openRoom('mixer'));
syncMixer();
select('#help').addEventListener('click', () => openRoom('help'));
dialog.addEventListener('close', () => finishResidentNoteChange(false));
select('#close-dialog').addEventListener('click', () => { if (dialog.classList.contains('radio-dialog')) leaveRadioRoom(); else dialog.close(); });
dialog.addEventListener('click', (event) => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
document.addEventListener('keydown', (event) => {
  if (event.target.matches('input,textarea') || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (event.key.toLowerCase() === 'm') toggleAudio();
  if (event.key.toLowerCase() === 'f') toggleFullscreen();
  if (event.key === 'Escape' && !dialog.open) {
    if (world.classList.contains('exploring')) setExploration(false);
    else if (world.classList.contains('immersive')) leaveCity();
  }
});
function updateNightLighting(now) {
  if (scenePaused()) return;
  const [hour, minute] = window.CityWeather.formatTime(now).split(':').map(Number);
  const level = hour === 0 ? 1 + Math.floor(minute / 20) : hour < 6 ? 3 : 0;
  if (world.dataset.nightLevel !== String(level)) world.dataset.nightLevel = String(level);
}
let weatherSnapshot = null;
let weatherLocation = window.CityWeather.presets[0];
let weatherOffset = 0;
let weatherPending = false;
let weatherController = null;
let weatherLastFetch = 0;
let climateSignature = '';
const weatherIcons = {
  clear: 'M16 12a4 4 0 1 1-8 0 4 4 0 1 1 8 0M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',
  moon: 'M16 3a9 9 0 1 0 5 15A11 11 0 0 1 16 3Z',
  cloudy: 'M7 17a4 4 0 0 1 0-8 5 5 0 0 1 10-1 4 4 0 0 1 1 9H7Z',
  rain: 'M7 14a4 4 0 0 1 0-8 5 5 0 0 1 10-1 4 4 0 0 1 1 9M7 18l-1 3m6-3-1 3m6-3-1 3',
  snow: 'M12 2v20M3 7l18 10M3 17 21 7M9 4l3 3 3-3M9 20l3-3 3 3M4 10l4-1-1-4M17 19l-1-4 4-1',
  fog: 'M5 8a4 4 0 0 1 7-4 4 4 0 0 1 7 4M3 12h18M5 16h14M3 20h18',
  storm: 'M7 14a4 4 0 0 1 0-8 5 5 0 0 1 10-1 4 4 0 0 1 1 8M13 12l-4 6h4l-2 5'
};
try {
  weatherLocation = window.CityWeather.validLocation(JSON.parse(localStorage.getItem('after-rain-city-v1'))) || weatherLocation;
  window.CityWeather.configureLocation(weatherLocation);
  const cached = JSON.parse(localStorage.getItem('after-rain-city-weather-v1'));
  if (cached?.locationKey === window.CityWeather.locationKey(weatherLocation)) weatherSnapshot = window.CityWeather.validate(cached.snapshot);
  else if (window.CityWeather.locationKey(weatherLocation) === window.CityWeather.locationKey(window.CityWeather.presets[0])) weatherSnapshot = window.CityWeather.validate(JSON.parse(localStorage.getItem('after-rain-weather-v1')));
} catch {}
function cityNow() { return Date.now() + weatherOffset; }
function escapeCityText(value) { return String(value).replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character])); }
function chooseCity(location) {
  const valid = window.CityWeather.validLocation(location);
  if (!valid) return;
  if (window.CityWeather.locationKey(valid) !== window.CityWeather.locationKey(weatherLocation)) {
    weatherController?.abort();
    weatherController = null;
    weatherPending = false;
    weatherLastFetch = 0;
    weatherSnapshot = null;
    weatherLocation = valid;
    window.CityWeather.configureLocation(valid);
    try { localStorage.setItem('after-rain-city-v1', JSON.stringify(valid)); localStorage.removeItem('after-rain-city-weather-v1'); localStorage.removeItem('after-rain-weather-v1'); } catch {}
  }
  weatherRoom();
  select('#room-title').setAttribute('tabindex', '-1');
  select('#room-title').focus({ preventScroll: true });
  updateClock();
}
function cityRoom() {
  content.innerHTML = `<h2 id="room-title" tabindex="-1">В каком ты городе?</h2><p>Небо, погода и часы будут жить по его времени. Наш уютный двор останется прежним.</p><div class="city-presets" aria-label="Быстрый выбор города">${window.CityWeather.presets.map((location, index) => `<button class="dialog-action secondary" data-city-preset="${index}" aria-pressed="${window.CityWeather.locationKey(location) === window.CityWeather.locationKey(weatherLocation)}">${location.name}</button>`).join('')}</div><form class="city-search" id="city-search"><label for="city-query">Или найди свой город</label><div><input id="city-query" name="city" type="search" minlength="2" maxlength="100" required autocomplete="off" placeholder="Например, Владивосток"><button class="dialog-action" type="submit">Найти</button></div></form><p id="city-search-status" role="status" aria-live="polite">Сейчас: ${escapeCityText(weatherLocation.name)}. Выбор сохранится в этом браузере.</p><div id="city-results" class="station-list city-results"></div><p>Геолокацию не запрашиваем. Поиск — только по кнопке, погода — раз в 10 минут в открытой вкладке. Наш сервер передаёт Open-Meteo только запрос города или его координаты, без IP посетителя.</p><p>Названия городов: <a href="https://www.geonames.org/" target="_blank" rel="noopener noreferrer">GeoNames ${svgIcon('external')}</a> через <a href="https://open-meteo.com/en/docs/geocoding-api" target="_blank" rel="noopener noreferrer">Open-Meteo</a>.</p><button class="dialog-action secondary" id="city-back">Назад к погоде</button>`;
  if (dialog.open) select('#room-title').focus({ preventScroll: true });
  content.querySelectorAll('[data-city-preset]').forEach((button) => button.addEventListener('click', () => chooseCity(window.CityWeather.presets[Number(button.dataset.cityPreset)])));
  select('#city-back').addEventListener('click', weatherRoom);
  const form = select('#city-search');
  const status = select('#city-search-status');
  const results = select('#city-results');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const query = select('#city-query').value.trim();
    if (query.length < 2 || form.getAttribute('aria-busy') === 'true') return;
    form.setAttribute('aria-busy', 'true');
    const submit = form.querySelector('button');
    submit.disabled = true;
    status.textContent = 'Ищем город…';
    results.replaceChildren();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`city-search?${new URLSearchParams({ name: query, count: '8', language: 'ru', format: 'json' })}`, { credentials: 'omit', mode: 'same-origin', redirect: 'error', signal: controller.signal });
      if (!response.ok) throw new Error('City search unavailable');
      const body = await response.text();
      if (body.length > 65536) throw new Error('City response too large');
      const data = JSON.parse(body);
      if (data.error || (data.results !== undefined && !Array.isArray(data.results))) throw new Error('Invalid city response');
      const locations = (data.results || []).slice(0, 8).map((location) => window.CityWeather.validLocation({ ...location, region: location.admin1 })).filter(Boolean);
      if (!form.isConnected) return;
      status.textContent = locations.length ? 'Выбери город. Регион поможет не перепутать тёзок.' : 'Город не найден. Попробуй другое название или латиницу.';
      results.innerHTML = locations.map((location, index) => `<button class="station-choice" data-city-result="${index}"><strong>${escapeCityText(location.name)}</strong><span>${escapeCityText([location.region, location.country].filter(Boolean).join(', '))}</span></button>`).join('');
      results.querySelectorAll('[data-city-result]').forEach((button) => button.addEventListener('click', () => chooseCity(locations[Number(button.dataset.cityResult)])));
    } catch {
      if (form.isConnected) status.textContent = 'Не удалось загрузить города. Попробуй ещё раз или выбери город выше.';
    } finally {
      clearTimeout(timeout);
      form.removeAttribute('aria-busy');
      submit.disabled = false;
    }
  });
}
function climateIcon(frame) { return weatherIcons[frame.kind === 'clear' && frame.phase === 'night' ? 'moon' : frame.kind] || weatherIcons.cloudy; }
function mixColour(dark, light, amount) {
  return '#' + [0, 2, 4].map((offset) => Math.round(parseInt(dark.slice(offset, offset + 2), 16) * (1 - amount) + parseInt(light.slice(offset, offset + 2), 16) * amount).toString(16).padStart(2, '0')).join('');
}
function applyClimate(frame) {
  if (scenePaused()) return;
  const signature = `${frame.light}:${frame.kind}:${frame.cloud}:${frame.wind}:${frame.precipitation}`;
  if (signature === climateSignature) return;
  climateSignature = signature;
  world.dataset.phase = frame.phase;
  world.dataset.weather = frame.kind;
  world.dataset.bright = String(frame.light > .55);
  Object.entries(cityPalette).forEach(([dark, light]) => world.style.setProperty(`--city-${dark}`, mixColour(dark, light, frame.light)));
  world.style.setProperty('--sky-top', mixColour('14272a', frame.cloud > .7 ? '9fb5b4' : 'bfd8d6', frame.light));
  world.style.setProperty('--sky-bottom', mixColour('1c3030', frame.cloud > .7 ? 'c0cebf' : 'e1e4c7', frame.light));
  world.style.setProperty('--cloud-colour', mixColour('536c6b', 'e5ece1', frame.light));
  world.style.setProperty('--cloud-opacity', frame.cloud * .8);
  world.style.setProperty('--sun-opacity', Math.max(0, 1 - frame.cloud * 1.25));
  world.style.setProperty('--stars-opacity', frame.kind === 'unknown' ? 0 : (1 - frame.cloud) * .65);
  world.style.setProperty('--night-light', Math.max(.08, 1 - frame.light));
  world.style.setProperty('--ground-wet', frame.precipitation ? .85 : .08);
  if (frame.kind !== 'storm') world.classList.remove('lightning');
  snowing = frame.kind === 'snow';
  weatherWind = Math.min(frame.wind, 70);
  rainLevel = frame.precipitation;
  rainColors = snowing ? ['#e5ece280', '#e5ece2aa', '#e5ece2cf'] : frame.light > .55 ? ['#375c5b44', '#375c5b66', '#375c5b88'] : ['rgba(177,205,200,.12)', 'rgba(177,205,200,.20)', 'rgba(177,205,200,.29)'];
  restartRain();
}
function weatherRoom() {
  const frame = window.CityWeather.frame(weatherSnapshot, cityNow());
  const temperature = frame.temperature === null ? 'Нет данных' : `${frame.temperature > 0 ? '+' : ''}${frame.temperature} °C`;
  const status = !frame.usable ? 'Свежая погода пока недоступна. Не придумываем осадки: часы и освещение продолжают работать для выбранного города.' : frame.stale ? 'Показаны последние доступные данные. Они могут отличаться от погоды сейчас.' : 'Погода для выбранной точки города. Условия в разных районах могут отличаться.';
  const shared = window.CityWeather.locationKey(weatherLocation) === window.CityWeather.locationKey(window.CityWeather.presets[0]);
  content.innerHTML = `<svg class="weather-symbol" viewBox="0 0 24 24" aria-hidden="true"><path d="${climateIcon(frame)}"/></svg><h2 id="room-title" tabindex="-1">${escapeCityText(weatherLocation.name)}</h2><button class="dialog-action secondary city-change" id="city-change">Выбрать другой город ${svgIcon('external')}</button><p>${status}</p><dl class="weather-facts"><div><dt>Температура</dt><dd>${temperature}</dd></div><div><dt>Небо</dt><dd>${frame.label}</dd></div><div><dt>Восход</dt><dd>${frame.sun ? window.CityWeather.formatTime(frame.sun.sunrise * 1000) : 'Нет данных'}</dd></div><div><dt>Закат</dt><dd>${frame.sun ? window.CityWeather.formatTime(frame.sun.sunset * 1000) : 'Нет данных'}</dd></div></dl><p>Местное время — ${window.CityWeather.formatTime(cityNow())}. Часовой пояс: ${escapeCityText(weatherLocation.timezone)}, независимо от настроек устройства. Свет меняется постепенно около восхода и заката.${frame.approximate ? ' Освещение сейчас рассчитано приблизительно по положению Солнца, в том числе для полярного дня и ночи.' : ''}</p><p>Данные: <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">Open-Meteo ${svgIcon('external')}</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Это оценка погодной модели с шагом 15 минут, не измерение у твоего окна.${weatherSnapshot ? ` Последние данные — ${window.CityWeather.formatDate(weatherSnapshot.observedAt * 1000)}, ${window.CityWeather.formatTime(weatherSnapshot.observedAt * 1000)} по местному времени.` : ''}</p><p>${shared ? 'Для Москвы используется общий серверный кеш.' : 'Погода загружается из Open-Meteo через наш сервер, без передачи IP посетителя.'} Обновление — раз в 10 минут в открытой вкладке. Геолокацию не запрашиваем. Выбор города сохраняется только в этом браузере. Погода меняет картинку, но не выбранные звуки.</p>`;
  select('#city-change').addEventListener('click', () => openRoom('cities'));
}
async function refreshWeather() {
  if (document.hidden || pageAway || weatherPending || Date.now() - weatherLastFetch < 600000) return;
  weatherPending = true;
  weatherLastFetch = Date.now();
  const controller = new AbortController();
  weatherController = controller;
  const requestedLocation = window.CityWeather.locationKey(weatherLocation);
  const shared = requestedLocation === window.CityWeather.locationKey(window.CityWeather.presets[0]);
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(shared ? 'weather.json' : window.CityWeather.forecastURL(weatherLocation), { cache: 'no-store', credentials: 'omit', mode: 'same-origin', redirect: 'error', signal: controller.signal });
    if (!response.ok) throw new Error('Weather unavailable');
    const body = await response.text();
    if (body.length > 16384) throw new Error('Weather response too large');
    if (controller !== weatherController || requestedLocation !== window.CityWeather.locationKey(weatherLocation)) return;
    const snapshot = shared ? window.CityWeather.validate(JSON.parse(body)) : window.CityWeather.fromForecast(JSON.parse(body));
    if (!snapshot) throw new Error('Invalid weather snapshot');
    const serverTime = Date.parse(response.headers.get('Date'));
    if (Number.isFinite(serverTime)) weatherOffset = serverTime - Date.now();
    weatherSnapshot = snapshot;
    try { localStorage.setItem('after-rain-city-weather-v1', JSON.stringify({ locationKey: requestedLocation, snapshot })); } catch {}
    if (dialog.open && select('#city-change')) {
      const focused = document.activeElement.id;
      weatherRoom();
      if (focused) document.getElementById(focused)?.focus({ preventScroll: true });
    }
  } catch {} finally {
    clearTimeout(timeout);
    if (controller === weatherController) {
      weatherController = null;
      weatherPending = false;
      updateClock();
    }
  }
}
function updateClock() {
  if (document.hidden || pageAway) return;
  const now = cityNow();
  select('#clock').textContent = window.CityWeather.formatTime(now);
  select('#clock').dateTime = new Date(now).toISOString();
  select('#clock').setAttribute('aria-label', `${window.CityWeather.formatTime(now)}, местное время: ${weatherLocation.name}`);
  select('#clock').title = `${weatherLocation.name} · ${weatherLocation.timezone}`;
  const frame = window.CityWeather.frame(weatherSnapshot, now);
  const label = `${weatherLocation.name} · ${frame.temperature === null ? frame.label : `${frame.temperature > 0 ? '+' : ''}${frame.temperature}° · ${frame.label}`}${frame.stale && frame.usable ? ' · данные устарели' : ''}`;
  if (select('#weather-label').textContent !== label) select('#weather-label').textContent = label;
  select('#weather-open').setAttribute('aria-label', `${label}. Погода и выбор города`);
  select('#weather-open').title = label;
  select('#weather-icon').setAttribute('d', climateIcon(frame));
  select('#city-greeting').textContent = frame.phase === 'night' ? 'Город засыпает' : frame.phase === 'dawn' ? 'Город просыпается' : frame.phase === 'dusk' ? 'Город замедляется' : 'Город живёт';
  select('#resident-teaser').textContent = frame.phase === 'night' ? 'В некоторых окнах ещё горит свет' : 'Здесь у каждого своя история';
  select('#meet-label').textContent = frame.phase === 'night' ? 'Кто ещё не спит?' : 'Заглянуть в окно';
  select('#city-invitation').textContent = frame.kind === 'rain' || frame.kind === 'storm' ? 'Послушай дождь. Найди своё окно.' : frame.kind === 'snow' ? 'За окном снег. Найди своё место.' : 'Послушай город. Найди своё окно.';
  applyClimate(frame);
  updateNightLighting(now);
  refreshWeather();
}
select('#weather-open').addEventListener('click', () => openRoom('weather'));
updateClock(); setInterval(updateClock, 10000);
function updateVisualViewport() {
  const viewport = window.visualViewport;
  document.documentElement.style.setProperty('--viewport-height', `${viewport?.height ?? window.innerHeight}px`);
  document.documentElement.style.setProperty('--viewport-top', `${viewport?.offsetTop ?? 0}px`);
}
updateVisualViewport();
window.visualViewport?.addEventListener('resize', updateVisualViewport, { passive: true });
window.visualViewport?.addEventListener('scroll', updateVisualViewport, { passive: true });
window.addEventListener('resize', () => { updateVisualViewport(); reserveResidentSpace(); }, { passive: true });
document.fonts?.ready.then(() => { residentSizeKey = ''; reserveResidentSpace(); });
window.addEventListener('pagehide', () => { clearInterval(melodyInterval); liveRadioEnabled = false; cancelPendingStation(); pauseStation(); layers.forEach((layer) => layer.track?.element.pause()); if (audio) audio.suspend(); });
window.addEventListener('pageshow', (event) => { if (event.persisted && audio) { if (playing) { audio.resume().catch(() => {}); if (musicLevel > 0) switchStation(stationIndex).catch(() => toast('Нажми на воспроизведение, чтобы вернуть звук.')); layers.forEach((layer) => startLayer(layer)); } melodyInterval = setInterval(() => { if (playing) playNote(); }, 3200); } });
