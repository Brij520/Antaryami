// Deterministic Vedic (sidereal) astrology core. No network, no randomness that
// cannot be reproduced: everything is derived from the birth date/time/place.

export const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

export const GRAHAS = [
  "Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn", "Rahu", "Ketu",
];

// Whole-sign houses from the ascendant.
export const HOUSE_NAMES = [
  "Self", "Wealth", "Siblings & Courage", "Home & Mother", "Creativity & Children",
  "Health & Service", "Partnership", "Transformation", "Dharma & Luck",
  "Career", "Gains", "Release & Expenses",
];

const DEG = Math.PI / 180;

/** Mean tropical longitude of the Sun for a Julian Day (Meeus, low precision). */
function sunLongitude(jd) {
  const n = jd - 2451545.0;
  const L = 280.46 + 0.9856474 * n;
  const g = (357.528 + 0.9856003 * n) * DEG;
  const lambda = L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g);
  return mod360(lambda);
}

/** Mean lunar longitude for a Julian Day (Meeus, low precision). */
function moonLongitude(jd) {
  const n = jd - 2451545.0;
  const L = 218.316 + 13.176396 * n;
  const M = (134.963 + 13.064993 * n) * DEG;
  const F = (93.272 + 13.229350 * n) * DEG;
  const lambda = L + 6.289 * Math.sin(M) - 1.274 * Math.sin(2 * F - M) * 0;
  return mod360(lambda);
}

const mod360 = (x) => ((x % 360) + 360) % 360;

/** Lahiri ayanamsa approximation, good to a few arc-minutes for 1900-2050. */
export function ayanamsa(jd) {
  const yearsFrom2000 = (jd - 2451545.0) / 365.25;
  return 23.85 + 0.013972 * yearsFrom2000;
}

export function julianDay({ year, month, day, hour = 12, minute = 0 }) {
  let y = year;
  let m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  const frac = (hour + minute / 60) / 24;
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) +
    day + frac + B - 1524.5;
}

/** Mean obliquity + ascendant formula (tropical), then converted to sidereal. */
function ascendantTropical(jd, latitude, longitude) {
  const eps = 23.4393 - 3.563e-7 * (jd - 2451545.0);
  const theta = mod360(280.46061837 + 360.98564736629 * (jd - 2451545.0) + longitude);
  const ramc = theta * DEG;
  const e = eps * DEG;
  const phi = latitude * DEG;
  const asc = Math.atan2(
    Math.cos(ramc),
    -(Math.sin(ramc) * Math.cos(e) + Math.tan(phi) * Math.sin(e)),
  ) / DEG;
  return mod360(asc);
}

export function computeChart(input) {
  const { date, time, latitude, longitude } = input;
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = (time || "12:00").split(":").map(Number);
  const jd = julianDay({ year, month, day, hour, minute });
  const ay = ayanamsa(jd);

  const sunTrop = sunLongitude(jd);
  const moonTrop = moonLongitude(jd);
  const ascTrop = ascendantTropical(jd, latitude, longitude);

  const sun = mod360(sunTrop - ay);
  const moon = mod360(moonTrop - ay);
  const asc = mod360(ascTrop - ay);

  const ascSign = Math.floor(asc / 30);

  // Deterministic derived points: Rahu regresses ~19.2°/yr from a 2000 epoch.
  const years = (jd - 2451545.0) / 365.25;
  const rahu = mod360(125.04 - 19.341 * years - ay);
  const ketu = mod360(rahu + 180);

  const bodies = { Sun: sun, Moon: moon, Rahu: rahu, Ketu: ketu };

  const houses = {};
  for (let i = 0; i < 12; i += 1) {
    const signIndex = (ascSign + i) % 12;
    houses[i + 1] = {
      number: i + 1,
      name: HOUSE_NAMES[i],
      sign: SIGNS[signIndex],
      signIndex,
      occupants: [],
    };
  }
  for (const [name, lng] of Object.entries(bodies)) {
    const signIndex = Math.floor(lng / 30);
    const house = ((signIndex - ascSign + 12) % 12) + 1;
    houses[house].occupants.push(name);
  }

  const nakIndex = Math.floor((moon / (360 / 27)));
  const pada = Math.floor((moon % (360 / 27)) / (360 / 108)) + 1;

  return {
    julianDay: Number(jd.toFixed(5)),
    ayanamsa: Number(ay.toFixed(4)),
    ascendant: { longitude: Number(asc.toFixed(4)), sign: SIGNS[ascSign], signIndex: ascSign },
    moon: {
      longitude: Number(moon.toFixed(4)),
      sign: SIGNS[Math.floor(moon / 30)],
      nakshatra: NAKSHATRAS[nakIndex],
      pada,
    },
    sun: { longitude: Number(sun.toFixed(4)), sign: SIGNS[Math.floor(sun / 30)] },
    rahu: { longitude: Number(rahu.toFixed(4)), sign: SIGNS[Math.floor(rahu / 30)] },
    ketu: { longitude: Number(ketu.toFixed(4)), sign: SIGNS[Math.floor(ketu / 30)] },
    houses,
  };
}
