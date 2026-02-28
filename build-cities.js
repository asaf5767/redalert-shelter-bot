const data = require('./cities_raw.json');
const fs = require('fs');

const cities = [];
for (const key of Object.keys(data)) {
  const c = data[key];
  if (!c.name || c.id === 0) continue;
  cities.push({
    name: c.name,
    name_en: c.name_en || '',
    zone: c.zone || '',
    zone_en: c.zone_en || '',
    countdown: c.countdown || 0
  });
}

cities.sort((a, b) => a.name.localeCompare(b.name, 'he'));
console.log('Clean cities count:', cities.length);
fs.writeFileSync('./src/data/cities.json', JSON.stringify(cities, null, 2));
console.log('Written to src/data/cities.json');
