window.CityWeather = (() => {
  const zone = 'Europe/Moscow';
  const dateFormat = new Intl.DateTimeFormat('sv-SE', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeFormat = new Intl.DateTimeFormat('ru-RU', { timeZone: zone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const clamp = (value) => Math.max(0, Math.min(1, value));
  const codes = {
    clear: [0, 1], cloudy: [2, 3], fog: [45, 48],
    rain: [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82],
    snow: [71, 73, 75, 77, 85, 86], storm: [95, 96, 97, 99]
  };
  const labels = { clear: 'ясно', cloudy: 'облачно', fog: 'туман', rain: 'дождь', snow: 'снег', storm: 'гроза', unknown: 'погода недоступна' };
  function kindOf(code) {
    return Object.keys(codes).find((kind) => codes[kind].includes(code)) || 'unknown';
  }
  function validate(value) {
    if (!value || value.version !== 1 || value.timezone !== zone) return null;
    const ranges = { fetchedAt: [1, 4102444800], observedAt: [1, 4102444800], temperature: [-80, 60], code: [0, 99], cloud: [0, 100], wind: [0, 250], precipitation: [0, 300] };
    if (Object.entries(ranges).some(([key, [minimum, maximum]]) => !Number.isFinite(value[key]) || value[key] < minimum || value[key] > maximum)) return null;
    if (!Number.isInteger(value.code) || kindOf(value.code) === 'unknown') return null;
    if (!Array.isArray(value.days) || !value.days.length || value.days.length > 3) return null;
    if (value.days.some((day) => !day || !/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isFinite(day.sunrise) || !Number.isFinite(day.sunset) || day.sunrise <= 0 || day.sunset > 4102444800 || day.sunset - day.sunrise < 3600 || day.sunset - day.sunrise > 86400)) return null;
    return value;
  }
  function solarAltitude(now) {
    const date = new Date(now);
    const year = date.getUTCFullYear();
    const day = Math.floor((Date.UTC(year, date.getUTCMonth(), date.getUTCDate()) - Date.UTC(year, 0, 0)) / 86400000);
    const hours = date.getUTCHours() + date.getUTCMinutes() / 60;
    const yearLength = new Date(Date.UTC(year, 1, 29)).getUTCMonth() === 1 ? 366 : 365;
    const angle = 2 * Math.PI / yearLength * (day - 1 + (hours - 12) / 24);
    const equation = 229.18 * (.000075 + .001868 * Math.cos(angle) - .032077 * Math.sin(angle) - .014615 * Math.cos(2 * angle) - .040849 * Math.sin(2 * angle));
    const declination = .006918 - .399912 * Math.cos(angle) + .070257 * Math.sin(angle) - .006758 * Math.cos(2 * angle) + .000907 * Math.sin(2 * angle) - .002697 * Math.cos(3 * angle) + .00148 * Math.sin(3 * angle);
    const latitude = 55.7558 * Math.PI / 180;
    const hourAngle = (hours * 60 + equation + 4 * 37.6173) / 4 * Math.PI / 180 - Math.PI;
    return Math.asin(Math.sin(latitude) * Math.sin(declination) + Math.cos(latitude) * Math.cos(declination) * Math.cos(hourAngle)) * 180 / Math.PI;
  }
  function daylight(now, days = []) {
    const date = new Date(now);
    const today = days.find((day) => day.date === dateFormat.format(date));
    let light;
    let morning;
    if (today) {
      const sunrise = today.sunrise * 1000;
      const sunset = today.sunset * 1000;
      light = Math.min(clamp((now - sunrise + 1800000) / 3600000), clamp((sunset + 1800000 - now) / 3600000));
      morning = now < (sunrise + sunset) / 2;
    } else {
      light = clamp((solarAltitude(now) + 6) / 12);
      morning = Number(timeFormat.format(date).slice(0, 2)) < 12;
    }
    return { light: Math.round(light * 100) / 100, phase: light === 0 ? 'night' : light === 1 ? 'day' : morning ? 'dawn' : 'dusk', approximate: !today, sun: today };
  }
  function frame(snapshot, now) {
    const age = snapshot ? (now / 1000 - snapshot.observedAt) : Infinity;
    const usable = snapshot && age >= -900 && age <= 5400;
    const kind = usable ? kindOf(snapshot.code) : 'unknown';
    const amount = usable ? snapshot.precipitation : 0;
    const precipitation = kind === 'snow' ? .35 + Math.min(.5, amount / 3) : kind === 'storm' ? .85 : kind === 'rain' ? .25 + Math.min(.65, amount / 5) : 0;
    return { ...daylight(now, snapshot?.days), kind, precipitation, cloud: usable ? snapshot.cloud / 100 : .35, wind: usable ? snapshot.wind : 0, temperature: usable ? Math.round(snapshot.temperature) : null, label: labels[kind], stale: age > 2700, usable: Boolean(usable) };
  }
  return { validate, daylight, frame, kindOf, formatTime: (now) => timeFormat.format(new Date(now)), formatDate: (now) => dateFormat.format(new Date(now)) };
})();
