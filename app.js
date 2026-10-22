const select = (selector) => document.querySelector(selector);
const world = select('#world');
const dialog = select('#room-dialog');
const content = select('#room-content');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const iconPaths = {
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
const polygon = (coordinates, fill, attributes = '') => `<polygon points="${points(coordinates)}" fill="${fill}" ${attributes}/>`;
const residents = [
  { name: 'Лена', place: 'Шестой этаж · окно с чайником', row: 0, column: 1, object: 'M57 76h19v13H57Zm19 2h4a4 4 0 0 1 0 8h-4M61 70c-4-4 4-6 0-10m7 10c-4-4 4-6 0-10', notes: [
    { id: 'lena-tea', title: 'Чайник уже закипел.', text: 'Опять заварила на двоих, хотя дома одна. Вторую чашку мысленно оставляю тебе. Сиди сколько хочется.' },
    { id: 'lena-bread', title: 'Почти по рецепту.', text: 'Испекла хлеб. Снизу подгорел, сверху красавец. Отрезала корочку и съела ещё тёплым, прямо у окна.' },
    { id: 'lena-umbrella', title: 'Чужой зонт.', text: 'Взяла в кафе не свой зонт. Этот весь в маленьких утках. Завтра верну, а сегодня дождь был неожиданно весёлым.' },
    { id: 'lena-laundry', title: 'Тёплая наволочка.', text: 'Разбирала бельё и нашла в пододеяльнике один носок. Второй всё ещё где-то путешествует. Не тороплю его.' },
    { id: 'lena-soup', title: 'На маленьком огне.', text: 'Суп тихонько булькает. В квартире пахнет укропом. Первый вечер за неделю, когда я никуда не опаздываю.' },
    { id: 'lena-call', title: 'Позвонила маме.', text: 'Собиралась на пять минут, проговорили сорок. Мама подробно рассказала про голубя на балконе. Хороший был голубь.' },
    { id: 'lena-book', title: 'Билет между страниц.', text: 'В старой книге нашёлся билет на поезд. Не помню сюжет, зато помню чай в подстаканнике и сосны за окном.' },
    { id: 'lena-cup', title: 'Та самая кружка.', text: 'У моей любимой кружки отбилась ручка. Теперь держу двумя ладонями. Чай всё такой же, только руки теплее.' },
    { id: 'lena-neighbor', title: 'Соседка сверху.', text: 'Отнесла соседке кусок пирога. Вернулась с тремя яблоками и историей про её первую работу. Неплохой обмен.' },
    { id: 'lena-fridge', title: 'Список на завтра.', text: 'На холодильнике написано: молоко, батарейки, погулять. Последний пункт всё время забываю. Сегодня обвела его.' },
    { id: 'lena-scarf', title: 'Ещё один ряд.', text: 'Вяжу шарф с сентября. Он уже длиннее меня, а пряжа не кончается. Похоже, к зиме одену весь подъезд.' },
    { id: 'lena-morning', title: 'Всё приготовлено.', text: 'Положила на стол чистую ложку и любимый чай. Маленький подарок завтрашней себе. Утром она обычно сонная.' }
  ] },
  { name: 'Миша', place: 'Пятый этаж · окно с пластинками', row: 1, column: 5, object: 'M49 74h39v16H49Zm29 8a10 4 0 1 1-20 0 10 4 0 1 1 20 0m5-5 2-5h5', notes: [
    { id: 'misha-record', title: 'Последняя сторона.', text: 'Пластинка закончилась минут десять назад. Всё сижу, слушаю, как шуршит игла. Иногда и этого достаточно.' },
    { id: 'misha-piano', title: 'Знакомые три ноты.', text: 'За стеной учат одну мелодию. Уже третий вечер. Сегодня сыграли без ошибки, и я тихонько похлопал в стену.' },
    { id: 'misha-cover', title: 'На обороте обложки.', text: 'Купил старую пластинку. На конверте написано: «Саше, чтобы не скучал». Саша, если что, музыка всё ещё хорошая.' },
    { id: 'misha-tram', title: 'Пропустил остановку.', text: 'Заслушался и проехал свой поворот. Шёл домой пешком мимо булочной. Теперь думаю, что всё правильно получилось.' },
    { id: 'misha-radio', title: 'Поймал волну.', text: 'Крутил ручку старого радио и наткнулся на песню из детства. Название не успели сказать. Напеваю, пока помню.' },
    { id: 'misha-cat', title: 'Новый слушатель.', text: 'Дворовый кот сидит под окном, пока играет джаз. На саксофоне щурится. Возможно, просто фонарь светит в глаза.' },
    { id: 'misha-cassette', title: 'Карандаш пригодился.', text: 'Нашёл кассету со школьной записью. Плёнку пришлось подкрутить карандашом. Наш басист всё ещё немного спешит.' },
    { id: 'misha-work', title: 'Ноутбук закрыт.', text: 'Отправил последний файл и закрыл крышку. Пластинка выбиралась дольше, чем вся работа. Зато теперь точно та.' },
    { id: 'misha-rain', title: 'Без ударных.', text: 'Выключил музыку: дождь по жестяному подоконнику сегодня играет лучше. Особенно та капля, которая всё время мимо ритма.' },
    { id: 'misha-shelf', title: 'По алфавиту не вышло.', text: 'Хотел разобрать пластинки, но каждую вторую включал. На полке всё ещё беспорядок. Вечер зато удался.' },
    { id: 'misha-friend', title: 'Один трек в ответ.', text: 'Друг прислал песню без единого слова. Не виделись полгода, а я сразу понял, что у него всё нормально.' },
    { id: 'misha-quiet', title: 'Погромче тишину.', text: 'Снял наушники, а в комнате гудит холодильник и кто-то идёт по лестнице. Ничего особенного. Просто я уже дома.' }
  ] },
  { name: 'Соня', place: 'Первый этаж · окно с растениями', row: 5, column: 0, object: 'M61 77h18l-3 13H64Zm9 0V54m0 14c-10 0-13-7-13-11 9 0 13 4 13 11Zm0-7c9 0 12-7 12-11-8 0-12 4-12 11Z', notes: [
    { id: 'sonya-leaf', title: 'Кажется, новый лист.', text: 'Поливала цветы и заметила маленький лист у фикуса. Три недели ничего, а потом — вот. На сегодня хороших новостей хватит.' },
    { id: 'sonya-cutting', title: 'Корешок в стакане.', text: 'Черенок, который дали в автобусе, пустил корни. Женщину звали Нина. Нина, у нас с вашим цветком всё получается.' },
    { id: 'sonya-basil', title: 'Базилик на ужин.', text: 'Вырастила базилик и теперь жалею срывать листья. Пока просто нюхаю его над макаронами. Тоже вполне работает.' },
    { id: 'sonya-snail', title: 'Кто-то ел салат.', text: 'На балконе обнаружилась улитка. Дала ей имя и кусочек огурца. Судя по всему, теперь у меня есть планы на отпуск.' },
    { id: 'sonya-pot', title: 'Горшок из барахолки.', text: 'Нашла синий горшок с неровным краем. Фикус в нём чуть кривоват. Зато вместе они выглядят очень уверенно.' },
    { id: 'sonya-window', title: 'Чистое стекло.', text: 'Вымыла окно. Оказалось, на доме напротив есть маленький флюгер. Живу здесь третий год, а кораблик заметила только сегодня.' },
    { id: 'sonya-seed', title: 'На пакетике — июнь.', text: 'Разбирала семена на подоконнике. За стеклом мокрый октябрь, а на каждом пакетике уже лето. Разложила по цветам.' },
    { id: 'sonya-walk', title: 'Лист в кармане.', text: 'Принесла с прогулки жёлтый лист. Дома он оказался ещё красивее. Положила в книгу, которую когда-нибудь дочитаю.' },
    { id: 'sonya-light', title: 'Переставила лампу.', text: 'Подвинула лампу к цветам. Теперь от монстеры на стене огромная тень. Сижу в своей маленькой ночной оранжерее.' },
    { id: 'sonya-gift', title: 'Один оставила себе.', text: 'Укоренила пять отростков, раздала четыре. Теперь у друзей на окнах живут кусочки моего подоконника. Приятно об этом думать.' },
    { id: 'sonya-balcony', title: 'После дождя.', text: 'Открыла балкон, и запахло мокрой землёй. Даже чай немного остыл, пока стояла. Пожалуй, заварю ещё.' },
    { id: 'sonya-drawing', title: 'Третий лист справа.', text: 'Рисовала свой фикус. Получилось дерево, которого не существует. Повесила рисунок рядом: пусть у него будет компания.' }
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
city.push(`<svg viewBox="0 0 1600 1000" xmlns="http://www.w3.org/2000/svg" role="group" aria-labelledby="city-title"><title id="city-title">Тихий квартал: кафе, заметки, комната для фокуса и три окна с записками жителей</title><defs>
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
  city.push(`<path d="M${x},${y + 5} l${width},${slope} l${depth},${-recess}" stroke="#98a99a" stroke-opacity=".15" fill="none" stroke-width="3"/>`);
  for (let row = 0; row < rows; row++) {
    const windowY = y + 30 + row * ((height - 50) / rows);
    if (detail) city.push(`<path d="M${x} ${windowY + 36}l${width} ${slope}" stroke="#101f23" stroke-opacity=".28" fill="none"/>`);
    for (let column = 0; column < columns; column++) {
      const windowX = x + 17 + column * ((width - 25) / columns);
      const offset = (windowX - x) * .2;
      const windowWidth = (width - 25) / columns * .49;
      const windowHeight = Math.min(29, (height - 50) / rows * .58);
      const isLit = random() < lit;
      const tint = random() > .65 ? '#d4bd8b' : '#b79865';
      const shape = [[windowX, windowY + offset], [windowX + windowWidth, windowY + offset + windowWidth * .2], [windowX + windowWidth, windowY + offset + windowWidth * .2 + windowHeight], [windowX, windowY + offset + windowHeight]];
      const nightWindow = isLit && detail && (row + column) % 2 === 0;
      if (nightWindow) {
        city.push(polygon(shape, '#142a2d', 'opacity=".7"'));
        city.push(`<g class="night-window night-window-${1 + (row + column) % 3}">`);
      }
      city.push(polygon(shape, isLit ? tint : '#142a2d', `opacity="${isLit ? .55 + random() * .4 : .7}"`));
      if (isLit && detail) {
        city.push(`<ellipse cx="${windowX + windowWidth / 2}" cy="${windowY + offset + windowHeight / 2}" rx="${windowWidth + 8}" ry="${windowHeight + 6}" fill="url(#lamp)" opacity=".5"/>`);
        city.push(`<path d="M${windowX + windowWidth * .55} ${windowY + offset + windowWidth * .11}v${windowHeight}" stroke="#273b37" stroke-width="2" opacity=".75"/>`);
        if (random() > .5) city.push(polygon([[windowX, windowY + offset], [windowX + windowWidth * .35, windowY + offset + 2], [windowX + windowWidth * .24, windowY + offset + windowHeight], [windowX, windowY + offset + windowHeight]], '#635f48', 'opacity=".6"'));
      }
      if (nightWindow) city.push('</g>');
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
  <path d="M0 0 70-35V-62L0-27Z" fill="#78857a"/><path d="M0 0-18-9v-27L0-27Z" fill="#465e58"/>
  <path d="M0-27 70-62 52-71-18-36Z" fill="#8b9584"/>
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
  city.push(`<g><ellipse cx="${x}" cy="${y + 2}" rx="49" ry="16" fill="url(#lamp)"/><path d="M${x} ${y}v-${height}q0-10 13-7l10 2" fill="none" stroke="#6c7c6b" stroke-width="2.5"/><ellipse cx="${x + 21}" cy="${y - height - 3}" rx="8" ry="3" fill="#ecd7a3"/><ellipse cx="${x + 21}" cy="${y - height + 12}" rx="53" ry="60" fill="url(#lamp)"/><path d="m${x + 18} ${y + 8}-28 63 10 2 29-64" fill="url(#reflection)"/></g>`);
}
lamp(799, 699, 105); lamp(1210, 777, 105); lamp(1445, 651, 90); lamp(654, 630, 85);
city.push(`<g transform="translate(1330 735) rotate(-28)"><ellipse rx="43" ry="21" fill="#071b2266"/><rect x="-34" y="-20" width="68" height="30" rx="10" fill="#60736c"/><rect x="-16" y="-19" width="31" height="28" rx="7" fill="#233b3a"/><path d="M-31-10h10m-10 11h10M21-10h8M21 1h8" stroke="#d6caa0" stroke-width="3"/></g>`);
city.push(`<g class="courtyard-details" aria-hidden="true" pointer-events="none">
  <g transform="translate(833 685) rotate(11.3) scale(.8)"><ellipse cx="16" cy="11" rx="31" ry="5" fill="#0a2026" opacity=".6"/>
    <g fill="none" stroke="#8b9c86" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" opacity=".75"><circle r="10"/><circle cx="32" r="10"/><path d="m0 0 10-17L14 0H0m14 0 11-17 7 17M10-17h15l-2-5h-5M10-17 7-23H3"/></g>
  </g>
  <g transform="translate(1138 712) rotate(-25)"><path d="M-17-10Q0-35 17-10 8-15 0-10q-8-5-17 0Z" fill="#7f8c75"/><path d="M0-10v28q0 7 6 5M0-25v-4" fill="none" stroke="#c0ad83" stroke-width="1.5" stroke-linecap="round"/></g>
  <g transform="translate(790 774) rotate(11.3)"><ellipse rx="36" ry="8" fill="#8ba69a" opacity=".13"/>
    <path d="m-12-4 12-13L12-4Z" fill="#c7c6ab" opacity=".75"/><path d="M-18-3h36L10 5H-8Z" fill="#a8b3a1"/><path d="M0-17V-4M-18-3 0 2l18-5m-44 14h16m18 2h13" fill="none" stroke="#6f8982" stroke-width="1"/>
  </g>
</g>`);
for (let index = 0; index < 95; index++) {
  const x = 550 + random() * 1000;
  const y = 700 + random() * 220;
  city.push(`<path d="M${x} ${y}l${8 + random() * 28} ${random() * 2}" stroke="${random() > .75 ? '#c6b17f' : '#6c9490'}" stroke-opacity="${random() * .17}"/>`);
}
function marker(x, y, label, icon, room) {
  city.push(`<g class="city-place" role="button" tabindex="0" aria-label="${label}" data-room="${room}"><rect x="${x - 50}" y="${y - 55}" width="100" height="100" fill="transparent" pointer-events="all"/><path class="window-light" d="M${x - 7} ${y + 15}h14v22h-14Z" fill="#f0ce93" opacity=".6"/><g class="place-marker"><rect class="marker-bg" x="${x - 17}" y="${y - 22}" width="34" height="34" rx="17" fill="#233c38" stroke="#c8bb8f" stroke-opacity=".65"/><svg x="${x - 9}" y="${y - 14}" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1dbad" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${iconPaths[icon]}"/></svg><path d="m${x - 4} ${y + 12} 4 5 4-5" fill="#233c38" stroke="#c8bb8f" stroke-opacity=".65"/><rect x="${x - 49}" y="${y - 49}" width="98" height="21" rx="10" fill="#1d3332" fill-opacity=".95"/><text x="${x}" y="${y - 35}" text-anchor="middle" font-size="10" fill="#cfceaf">${label}</text></g></g>`);
}
marker(952, 602, 'Кафе «Не спится»', 'music', 'radio');
marker(1018, 427, 'Твои мысли', 'pencil', 'notes');
marker(1172, 363, 'Тихая комната', 'clock', 'focus');
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
select('#scene').innerHTML = city.join('');
const residentButtons = [...document.querySelectorAll('.resident-window')];
const lastResidentIndex = residents.findIndex((resident) => resident.notes.some((note) => note.id === lastResidentNote));
let litResident = lastResidentIndex < 0 ? Math.floor(Math.random() * residents.length) : (lastResidentIndex + 1) % residents.length;
const cityTram = select('#city-tram');
let cityLifeTimeout;
let cityLifeTick = 0;
let pageAway = false;
function scenePaused() { return document.hidden || dialog.open || pageAway; }
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
  if (cityLifeTick % 10 === 2) cityTram.classList.add('tram-passing');
}
cityTram.addEventListener('animationend', (event) => {
  if (event.animationName === 'city-tram-pass') cityTram.classList.remove('tram-passing');
});
function scheduleCityLife() {
  clearTimeout(cityLifeTimeout);
  if (scenePaused() || reducedMotion.matches) return;
  cityLifeTimeout = setTimeout(() => { advanceCityLife(); scheduleCityLife(); }, 18000);
}

const canvas = select('#rain');
const context = canvas.getContext('2d');
let viewportWidth = 0;
let viewportHeight = 0;
let drops = [];
let rainLevel = .55;
let lastFrame = null;
let rainFrame;
const rainFrameDuration = 1000 / 30;
const rainColors = ['rgba(177,205,200,.12)', 'rgba(177,205,200,.20)', 'rgba(177,205,200,.29)'];
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
  if (scenePaused()) return;
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
      drop.y += drop.speed * delta;
      drop.x -= drop.speed * delta * .24;
      if (drop.y > viewportHeight + 30) { drop.y = -30; drop.x = random() * (viewportWidth + 200); }
      if (drop.x < -30) drop.x = viewportWidth + 30;
    }
  }
  context.lineWidth = .65;
  for (let group = 0; group < rainColors.length; group++) {
    context.strokeStyle = rainColors[group];
    context.beginPath();
    for (let index = 0; index < count; index++) {
      const drop = drops[index];
      if (drop.group !== group) continue;
      context.moveTo(drop.x, drop.y);
      context.lineTo(drop.x - drop.length * .24, drop.y + drop.length);
    }
    context.stroke();
  }
  if (!reducedMotion.matches) rainFrame = requestAnimationFrame(drawRain);
}
function restartRain() {
  cancelAnimationFrame(rainFrame);
  rainFrame = undefined;
  lastFrame = null;
  if (!scenePaused()) drawRain(0);
}
function syncSceneActivity() {
  world.classList.toggle('scene-paused', scenePaused());
  if (reducedMotion.matches) {
    world.classList.remove('cat-turned', 'cat-away', 'entrance-lit');
    cityTram.classList.remove('tram-passing');
  }
  updateNightLighting(new Date());
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
  { name: 'Между снами', description: 'Море и мягкий прибой', sound: 'waves', notes: [], wave: 'sine' }
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
const layers = [
  { id: 'fire', name: 'Камин', detail: 'Потрескивание дров', icon: 'M13 3c1 5-4 6-2 10 1-1 2-2 2-4 5 4 6 7 3 10-3 3-9 2-10-2-1-4 3-6 7-14Z', cutoff: 5500 },
  { id: 'thunder', name: 'Гроза', detail: 'Далёкие раскаты, без дождя', icon: 'M7 14a4 4 0 0 1 0-8 5 5 0 0 1 10-1 4 4 0 0 1 1 8M13 12l-4 6h4l-2 5', cutoff: 2000 },
  { id: 'wind', name: 'Ветер', detail: 'Шелест деревьев', icon: 'M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6a3 3 0 1 1-3 3', cutoff: 2400 },
  { id: 'crickets', name: 'Сверчки', detail: 'Тёплая летняя ночь', icon: 'M9 9c0-5 6-5 6 0v7c0 5-6 5-6 0ZM9 11 4 8m11 3 5-3M9 15H3m12 0h6M9 18l-4 4m10-4 4 4M10 5 8 2m6 3 2-3', cutoff: 7500 },
  { id: 'metro', name: 'Питерское метро', detail: 'Синяя ветка, объявления в вагоне', icon: 'M7 3h10c2 0 3 2 3 4v10H4V7c0-2 1-4 3-4ZM4 11h16M8 3v8m8-8v8M7 14h1m8 0h1M8 17l-3 5m11-5 3 5M7 20h10', cutoff: 6000 },
  { id: 'rain', name: 'Дождь', detail: 'Настоящие капли за окном', icon: 'M7 14a4 4 0 0 1 0-8 5 5 0 0 1 10-1 4 4 0 0 1 1 9M7 18l-1 3m6-3-1 3m6-3-1 3', cutoff: 3200 }
].map((layer) => ({ ...layer, level: 0, lastLevel: .35, track: null, pending: null, loading: false, failed: false }));
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
  }
  const mixPlay = select('#mix-play');
  if (mixPlay) mixPlay.textContent = playing ? 'Пауза' : 'Слушать микс';
  const feedback = select('#mix-feedback');
  if (feedback) feedback.firstChild.textContent = activeCount ? 'Настройки сохраняются в этом браузере. ' : 'Всё выключено. Начни с одного звука. ';
  select('#station-name').textContent = selectedLayers.length ? 'Свой микс' : stations[stationIndex].name;
  select('.dock-caption').textContent = selectedLayers.length ? 'Твоя атмосфера' : 'Ночное радио';
  select('#station').setAttribute('aria-label', selectedLayers.length ? 'Открыть свой микс' : 'Сменить радиостанцию');
}
function createLayerTrack(layer) {
  const element = document.createElement('audio');
  element.src = `sounds/${layer.id}.mp3`;
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
async function setLayerLevel(id, value) {
  const layer = layers.find((entry) => entry.id === id);
  layer.level = Math.max(0, Math.min(1, value));
  if (layer.level > 0) layer.lastLevel = layer.level;
  if (layer.track && audio) {
    layer.track.gain.gain.setTargetAtTime(layer.level * .7, audio.currentTime, .1);
    if (!layer.level) setTimeout(() => { if (!layer.level) layer.track.element.pause(); }, 400);
  }
  saveMix(); syncMixer();
  if (layer.level > 0) {
    if (!playing) await toggleAudio();
    startLayer(layer);
  }
}
function setRadioLevel(value) {
  musicLevel = Math.max(0, Math.min(1, value));
  if (audio) {
    musicGain.gain.setTargetAtTime(musicLevel * .8, audio.currentTime, .12);
    if (musicLevel > 0 && playing) switchStation(stationIndex).catch(() => {});
    if (!musicLevel && activeTrack) {
      const track = activeTrack;
      setTimeout(() => { if (!musicLevel && activeTrack === track) track.element.pause(); }, 400);
    }
  }
  saveMix(); syncMixer();
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
  track.element.pause();
  track.element.removeAttribute('src');
  track.element.load();
  track.element.remove();
  track.source.disconnect();
  track.gain.disconnect();
}
async function switchStation(index) {
  const request = ++stationRequest;
  if (!audio) makeAudio();
  if (activeTrack?.index === index) {
    const playback = activeTrack.element.play();
    await audio.resume();
    await playback;
    return request === stationRequest;
  }
  const element = document.createElement('audio');
  element.src = `sounds/${stations[index].sound}.mp3`;
  element.loop = true;
  element.preload = 'none';
  element.hidden = true;
  element.dataset.stationAudio = stations[index].sound;
  document.body.append(element);
  const source = audio.createMediaElementSource(element);
  const gain = audio.createGain();
  gain.gain.value = 0;
  source.connect(gain); gain.connect(musicGain);
  const track = { element, source, gain, index };
  let timeout;
  try {
    const playback = element.play();
    await audio.resume();
    await Promise.race([playback, new Promise((resolve, reject) => { timeout = setTimeout(() => reject(new Error('Audio load timeout')), 20000); })]);
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
    select('#station-name').textContent = stations[index].name;
    changeChord();
    saveMix();
    element.addEventListener('error', () => {
      if (activeTrack === track) toast('Запись прервалась. Выключи и включи звук, чтобы повторить.');
    });
    return true;
  } catch (error) {
    disposeTrack(track);
    if (request === stationRequest) toast('Не удалось загрузить запись. Попробуй выбрать волну ещё раз.');
    throw error;
  } finally { clearTimeout(timeout); }
}
async function toggleAudio() {
  if (audioBusy) return;
  audioBusy = true;
  try {
    if (!audio) makeAudio();
    if (!playing && musicLevel > 0) await switchStation(stationIndex);
    await audio.resume();
    playing = !playing;
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
        audio.suspend().catch(() => {});
      }
    }, 1200);
    syncMixer();
    if (!playing && activeTrack) {
      const track = activeTrack;
      setTimeout(() => { if (!playing && activeTrack === track) track.element.pause(); }, 1200);
    }
  } catch {
    toast('Не удалось включить звук. Попробуй ещё раз.');
  } finally { audioBusy = false; }
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
  content.innerHTML = `<nav class="sound-tabs" aria-label="Настройки звука"><button class="current" aria-current="page">Радио</button><button id="to-mixer">Свой микс</button></nav><h2 id="room-title">У каждого своя волна.</h2><p>Гул кафе, стук колёс или море за окном. Выбери место, в котором хочется остаться.</p><div class="station-list">${stations.map((station, index) => `<button class="station-choice ${index === stationIndex ? 'selected' : ''}" data-station="${index}" aria-pressed="${index === stationIndex}">${station.name}<span>${station.description}</span></button>`).join('')}</div><p>Добавь камин, ветер или метро во вкладке «Свой микс».<br><a href="sounds/credits.html" target="_blank" rel="noopener">Звуки и авторы ${svgIcon('external')}</a></p><button class="dialog-action" id="radio-toggle">${playing ? 'Выключить звук' : 'Включить звук'}</button>`;
  select('#to-mixer').addEventListener('click', () => openRoom('mixer'));
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
        radioRoom(); content.querySelector(`[data-station="${stationIndex}"]`).focus();
      }
    }
  }));
  select('#radio-toggle').addEventListener('click', async () => { await toggleAudio(); const button = select('#radio-toggle'); if (button) button.textContent = playing ? 'Выключить звук' : 'Включить звук'; });
}
function mixerRoom() {
  content.innerHTML = `<nav class="sound-tabs" aria-label="Настройки звука"><button id="to-radio">Радио</button><button class="current" aria-current="page">Свой микс</button></nav><h2 id="room-title">Собери своё место.</h2><p class="mixer-intro">Камин дома. Метро где-то внизу. Ночь за окном.<br>Включай звуки и находи свой баланс.</p><div class="mixer-list">${layers.map((layer) => `<div class="layer-row" data-layer-row="${layer.id}"><button class="layer-toggle" aria-label="Включить: ${layer.name}" aria-pressed="false"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="${layer.icon}"/></svg></button><div class="layer-copy"><span class="layer-name">${layer.name}</span><span class="layer-detail">${layer.detail}</span></div><input type="range" min="0" max="100" value="0" aria-label="Громкость: ${layer.name}"><output>0%</output></div>`).join('')}<div class="layer-row radio-layer" data-radio-row><button class="layer-toggle" aria-label="Выключить: Ночное радио" aria-pressed="true"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h16v12H4ZM7 8l10-5M8 12v4m-2-2h4m4-2h3m-3 4h3"/></svg></button><div class="layer-copy"><span class="layer-name">Ночное радио</span><span class="layer-detail">${stations[stationIndex].name}</span></div><input type="range" min="0" max="100" value="45" aria-label="Громкость: Ночное радио"><output>45%</output></div></div><div class="mix-actions"><button class="dialog-action" id="mix-play">Слушать микс</button><button class="mix-clear" id="mix-clear">Выключить всё</button></div><p class="mix-footnote" id="mix-feedback" role="status">Настройки сохраняются в этом браузере. <a href="sounds/credits.html" target="_blank" rel="noopener">Звуки и авторы ${svgIcon('external')}</a></p>`;
  select('#to-radio').addEventListener('click', () => openRoom('radio'));
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
    layers.forEach((layer) => setLayerLevel(layer.id, 0));
    setRadioLevel(0);
    if (playing) await toggleAudio();
  });
  syncMixer();
}
function residentRoom(index) {
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
      <path d="${resident.object}" stroke="#d7bf95" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" transform="translate(20 0)"/>
      <defs><radialGradient id="resident-glow"><stop stop-color="#e5c28c" stop-opacity=".25"/><stop offset="1" stop-color="#e5c28c" stop-opacity="0"/></radialGradient></defs>
    </svg>
    <blockquote class="resident-note" aria-live="polite" aria-atomic="true">${note.text}</blockquote><p class="resident-signature"><strong>${resident.name}</strong><span>${resident.place}</span></p>
    <div class="resident-actions"><button class="dialog-action" id="resident-more">Ещё записка ${svgIcon('notes')}</button><button class="dialog-action secondary" id="resident-next">Другое окно ${svgIcon('external')}</button><button class="mix-clear" id="resident-return">Вернуться в город</button></div>`;
  select('#resident-more').addEventListener('click', () => {
    const nextNote = chooseResidentNote(index);
    select('#room-title').textContent = nextNote.title;
    select('.resident-note').textContent = nextNote.text;
  });
  select('#resident-next').addEventListener('click', () => {
    residentRoom((litResident + 1) % residents.length);
    select('#resident-next').focus({ preventScroll: true });
  });
  select('#resident-return').addEventListener('click', () => dialog.close());
}
function openRoom(room) {
  dialog.classList.toggle('mixer-dialog', room === 'mixer');
  dialog.classList.toggle('resident-dialog', room === 'resident');
  if (room === 'radio') radioRoom();
  if (room === 'mixer') mixerRoom();
  if (room === 'resident') residentRoom(litResident);
  if (room === 'notes') {
    content.innerHTML = `<span class="room-eyebrow">Окно на четвёртом</span><h2 id="room-title">Оставь это здесь.</h2><p>Мысль, которая не даёт уснуть. Идею на завтра. Или пару слов самому себе.</p><label for="notes" class="saved-label">Твои заметки</label><textarea id="notes" placeholder="О чём ты сейчас думаешь?"></textarea><span class="saved-label" id="save-status" role="status">Только в этом браузере. Только для тебя.</span>`;
    try { select('#notes').value = localStorage.getItem('after-rain-notes') || ''; } catch { select('#save-status').textContent = 'Хранилище недоступно. Скопируй заметку перед закрытием.'; }
    select('#notes').addEventListener('input', (event) => {
      try { localStorage.setItem('after-rain-notes', event.target.value); select('#save-status').textContent = 'Сохранено. Можно отпустить.'; }
      catch { select('#save-status').textContent = 'Не удалось сохранить. Скопируй текст перед закрытием.'; }
    });
  }
  if (room === 'focus') {
    content.innerHTML = `<span class="room-eyebrow">Тихая комната</span><h2 id="room-title">Одно дело. Без суеты.</h2><p>Двадцать пять минут для того, что важно сейчас. Остальное подождёт за дверью.</p><div class="timer-display" id="timer-display" role="timer" aria-label="Оставшееся время">25:00</div><button class="dialog-action" id="timer-toggle">Начать</button><button class="dialog-action secondary" id="timer-reset">Сначала</button><p>Можешь закрыть окно — время продолжит идти.</p>`;
    select('#timer-toggle').addEventListener('click', () => {
      if (timerRunning) { updateTimer(); timerRunning = false; }
      else { if (!timerRemaining) timerRemaining = 1500; timerDeadline = Date.now() + timerRemaining * 1000; timerRunning = true; }
      updateTimer();
    });
    select('#timer-reset').addEventListener('click', () => { timerRunning = false; timerRemaining = 1500; updateTimer(); });
    updateTimer();
  }
  if (room === 'help') {
    content.innerHTML = `<span class="room-eyebrow">Добро пожаловать в квартал</span><h2 id="room-title">Здесь можно выдохнуть.</h2><p>Нажми на светящуюся метку в городе. В кафе — три музыкальные волны. В окне с карандашом — место для мыслей. Под часами — 25 минут тишины для одного дела.</p><p>Ползунки внизу меняют дождь и музыку. «Побыть здесь» убирает заголовок и включает звук.</p><div class="help-keys"><span><kbd>M</kbd>звук</span><span><kbd>F</kbd>весь экран</span><span><kbd>Esc</kbd>назад</span></div>`;
  }
  if (!dialog.open) dialog.showModal();
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
select('#station').addEventListener('click', () => openRoom(layers.some((layer) => layer.level > 0) ? 'mixer' : 'radio'));
select('#mixer').addEventListener('click', () => openRoom('mixer'));
syncMixer();
select('#help').addEventListener('click', () => openRoom('help'));
select('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', (event) => {
  const bounds = dialog.getBoundingClientRect();
  if (event.target === dialog && (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)) dialog.close();
});
document.addEventListener('keydown', (event) => {
  if (event.target.matches('input,textarea') || event.ctrlKey || event.metaKey || event.altKey || event.repeat) return;
  if (event.key.toLowerCase() === 'm') toggleAudio();
  if (event.key.toLowerCase() === 'f') toggleFullscreen();
  if (event.key === 'Escape' && !dialog.open && world.classList.contains('immersive')) leaveCity();
});
function updateNightLighting(now) {
  if (scenePaused()) return;
  const hour = now.getHours();
  const level = hour === 0 ? 1 + Math.floor(now.getMinutes() / 20) : hour < 6 ? 3 : 0;
  if (world.dataset.nightLevel !== String(level)) world.dataset.nightLevel = String(level);
}
function updateClock() {
  const now = new Date();
  select('#clock').textContent = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  select('#clock').dateTime = now.toISOString();
  updateNightLighting(now);
}
updateClock(); setInterval(updateClock, 10000);
function updateVisualViewport() {
  const viewport = window.visualViewport;
  document.documentElement.style.setProperty('--viewport-height', `${viewport?.height ?? window.innerHeight}px`);
  document.documentElement.style.setProperty('--viewport-top', `${viewport?.offsetTop ?? 0}px`);
}
updateVisualViewport();
window.visualViewport?.addEventListener('resize', updateVisualViewport, { passive: true });
window.visualViewport?.addEventListener('scroll', updateVisualViewport, { passive: true });
window.addEventListener('resize', updateVisualViewport, { passive: true });
window.addEventListener('pagehide', () => { clearInterval(melodyInterval); if (activeTrack) activeTrack.element.pause(); layers.forEach((layer) => layer.track?.element.pause()); if (audio) audio.suspend(); });
window.addEventListener('pageshow', (event) => { if (event.persisted && audio) { if (playing) { audio.resume().catch(() => {}); if (musicLevel > 0) activeTrack?.element.play().catch(() => toast('Нажми на воспроизведение, чтобы вернуть звук.')); layers.forEach((layer) => startLayer(layer)); } melodyInterval = setInterval(() => { if (playing) playNote(); }, 3200); } });
