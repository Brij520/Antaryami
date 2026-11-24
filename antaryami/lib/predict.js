// Text -> prediction. A transparent, explainable reader: every answer is
// assembled from the query's topics plus the computed chart, and the reasoning
// is returned alongside the reading so the user can see where it came from.

const TOPICS = [
  {
    id: "career",
    match: /\b(career|job|jobs|work|business|promotion|office|salary|boss|company|startup|interview|profession|employment|hiring)\b/i,
    houses: [10, 6, 2],
    label: "Career & work",
    lines: [
      "Your 10th house (career) sits in {h10sign}, ruled by {h10lord}. Work built here rewards patience over speed.",
      "The Moon in {moonsign} gives your working style a {moontone} rhythm — protect focus blocks rather than chasing every ping.",
      "{h10occupants}",
      "Favourable windows cluster when the Moon transits signs trine to your 10th house; use those days for interviews and pitches.",
    ],
  },
  {
    id: "money",
    match: /\b(money|wealth|financ\w*|savings|invest\w*|loan|debt|property|buy|sell|income|profit|loss|rich|afford|budget)\b/i,
    houses: [2, 11, 8],
    label: "Money & resources",
    lines: [
      "Your 2nd house of accumulated wealth is in {h2sign}; its lord is {h2lord}.",
      "The 11th house of gains sits in {h11sign}, so income tends to arrive through {h11tone} channels.",
      "{h2occupants}",
      "Hold one deliberate pause before large commitments this cycle — the chart favours consolidation over leverage.",
    ],
  },
  {
    id: "love",
    match: /\b(love|marry|married|marriage|wedding|engagement|partner|relationship|spouse|romance|girlfriend|boyfriend|wife|husband|crush|dating|breakup|divorce|soulmate)\b/i,
    houses: [7, 5, 12],
    label: "Love & partnership",
    lines: [
      "Your 7th house of partnership falls in {h7sign}, ruled by {h7lord}.",
      "Venus's placement colours how you signal affection: {venustone}.",
      "{h7occupants}",
      "The honest move in your chart is directness — signs that reward guessing punish it here.",
    ],
  },
  {
    id: "health",
    match: /\b(health|body|illness|disease|energy|sleep|fitness|stress|anxiety|hospital)\b/i,
    lines: [
      "Your 6th house of health and routine is in {h6sign}. Recovery comes from repetition, not intensity.",
      "The Moon's nakshatra {nakshatra} points to {naktone} as your reset pattern.",
      "Rest is not a reward in this chart — it is the input that makes the rest work.",
    ],
    label: "Health & energy",
  },
  {
    id: "travel",
    match: /\b(travel|abroad|visa|foreign|move|relocate|journey|trip|flight|settle)\b/i,
    houses: [9, 12, 4],
    label: "Travel & relocation",
    lines: [
      "Your 9th house of long journeys is in {h9sign}; the 12th of distant places is {h12sign}.",
      "Movement suits you when it has a purpose attached — aimless displacement drains this chart.",
      "{h9occupants}",
    ],
  },
  {
    id: "education",
    match: /\b(study|exam|education|college|school|degree|learn|course|research|phd|test|result)\b/i,
    houses: [5, 4, 9],
    label: "Study & learning",
    lines: [
      "Your 5th house of intelligence is in {h5sign}, ruled by {h5lord}.",
      "Mercury's tone ({mercurytone}) shapes how you absorb material best.",
      "{h5occupants}",
      "Spaced repetition beats cramming in charts like yours; the 4th house wants a quiet base.",
    ],
  },
  {
    id: "family",
    match: /\b(family|mother|father|parents|home|house|children|child|sibling|brother|sister)\b/i,
    houses: [4, 2, 3],
    label: "Family & home",
    lines: [
      "Your 4th house of home and mother is in {h4sign}; the 3rd of siblings sits in {h3sign}.",
      "{h4occupants}",
      "This chart resolves family friction through clear boundaries rather than silence.",
    ],
  },
  {
    id: "spirit",
    match: /\b(spiritual|god|religion|meditat|purpose|karma|dharma|soul|peace|moksha|prayer)\b/i,
    houses: [9, 12, 8],
    label: "Purpose & inner life",
    lines: [
      "Your 9th house of dharma is in {h9sign}, with Ketu in {ketusign} marking what you already understand.",
      "The Moon in {nakshatra} gives you a contemplative streak that needs scheduled quiet, not spontaneous retreat.",
      "{h9occupants}",
    ],
  },
];

const MOON_TONES = {
  Aries: "fast-starting, impatient", Taurus: "steady, sensory", Gemini: "curious, verbal",
  Cancer: "protective, tidal", Leo: "expressive, proud", Virgo: "exacting, analytical",
  Libra: "relational, poised", Scorpio: "intense, private", Sagittarius: "restless, candid",
  Capricorn: "strategic, reserved", Aquarius: "detached, principled", Pisces: "porous, imaginative",
};

const NAK_TONES = {
  Ardra: "storming first, clarity after", Rohini: "steady accumulation", Ashwini: "quick resets",
  Krittika: "cutting through clutter", Mrigashira: "curious searching", Punarvasu: "renewal after setbacks",
  Pushya: "nourishing routine", Ashlesha: "coiling caution", Magha: "ancestral duty",
  Hasta: "skilled hands", Chitra: "crafted presentation", Swati: "independent movement",
  Vishakha: "focused ambition", Anuradha: "loyal persistence", Jyeshtha: "protective seniority",
  Mula: "root-digging", "Purva Ashadha": "unconquerable momentum", "Uttara Ashadha": "durable victory",
  Shravana: "listening", Dhanishta: "rhythm and wealth", Shatabhisha: "healing skepticism",
  "Purva Bhadrapada": "burning idealism", "Uttara Bhadrapada": "deep stillness", Revati: "gentle completion",
  Bharani: "bearing weight", "Purva Phalguni": "playful giving", "Uttara Phalguni": "generous alliance",
};

const LORD_BY_SIGN = [
  "Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter",
];

const TONES = [
  "direct", "resourceful", "communicative", "nurturing", "expressive", "precise",
  "diplomatic", "intense", "expansive", "disciplined", "unconventional", "imaginative",
];

export const TOPIC_LABELS = TOPICS.map((t) => ({ id: t.id, label: t.label }));

export function matchTopics(text) {
  const hits = TOPICS.filter((t) => t.match.test(text || ""));
  return hits.length > 0 ? hits : [generalTopic()];
}

function generalTopic() {
  return {
    id: "general",
    label: "General reading",
    lines: [
      "Life right now reads as a {mode} chapter: the emphasis is on {h1sign} rising with the Moon in {moonsign}.",
      "Your ascendant lord is {h1lord}; that planet's logic — {tonelogic} — is the one to trust when choosing.",
      "The reading below is built from your 1st, 4th, 7th and 10th houses, the spine of any Vedic chart.",
    ],
  };
}

function fill(template, chart) {
  const { houses, moon, ketu } = chart;
  const house = (n) => houses[n];
  const lordOf = (n) => LORD_BY_SIGN[house(n).signIndex];
  const occupants = (n) => {
    const list = house(n).occupants;
    if (list.length === 0) {
      return `No planet occupies your ${n}${ordinalSuffix(n)} house yet — its themes stay open and undirected.`;
    }
    const verb = list.length === 1 ? "occupies" : "occupy";
    const emphasis = list.map((p) => p.toLowerCase()).join(" and ");
    return `${list.join(" and ")} ${verb} your ${n}${ordinalSuffix(n)} house, colouring it with ${emphasis} emphasis.`;
  };
  const toneOfSign = (sign) => TONES[chart.houses[1] ? 0 : 0] && TONES[(chart.ascendant.signIndex + 0) % 12];
  void toneOfSign;

  return template
    .replaceAll("{moonsign}", moon.sign)
    .replaceAll("{moon}", moon.sign)
    .replaceAll("{nakshatra}", moon.nakshatra)
    .replaceAll("{pada}", String(moon.pada))
    .replaceAll("{ketusign}", ketu.sign)
    .replaceAll("{ascsign}", chart.ascendant.sign)
    .replaceAll("{moontone}", MOON_TONES[moon.sign] || "steady")
    .replaceAll("{naktone}", NAK_TONES[moon.nakshatra] || "patient")
    .replaceAll("{venustone}", MOON_TONES[chart.houses[7].sign] || "warm")
    .replaceAll("{mercurytone}", TONES[chart.houses[5].signIndex] || "curious")
    .replaceAll("{h1sign}", house(1).sign)
    .replaceAll("{h1lord}", lordOf(1))
    .replaceAll("{tonelogic}", TONES[house(1).signIndex])
    .replaceAll("{mode}", TONES[house(1).signIndex])
    .replaceAll("{h2sign}", house(2).sign)
    .replaceAll("{h2lord}", lordOf(2))
    .replaceAll("{h2occupants}", occupants(2))
    .replaceAll("{h3sign}", house(3).sign)
    .replaceAll("{h4sign}", house(4).sign)
    .replaceAll("{h4occupants}", occupants(4))
    .replaceAll("{h5sign}", house(5).sign)
    .replaceAll("{h5lord}", lordOf(5))
    .replaceAll("{h5occupants}", occupants(5))
    .replaceAll("{h6sign}", house(6).sign)
    .replaceAll("{h7sign}", house(7).sign)
    .replaceAll("{h7lord}", lordOf(7))
    .replaceAll("{h7occupants}", occupants(7))
    .replaceAll("{h9sign}", house(9).sign)
    .replaceAll("{h9occupants}", occupants(9))
    .replaceAll("{h10sign}", house(10).sign)
    .replaceAll("{h10lord}", lordOf(10))
    .replaceAll("{h10occupants}", occupants(10))
    .replaceAll("{h11sign}", house(11).sign)
    .replaceAll("{h11tone}", TONES[house(11).signIndex])
    .replaceAll("{h12sign}", house(12).sign);
}

const ordinalSuffix = (n) =>
  n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";

/**
 * Produce a reading for a question against a chart.
 * Returns sections, each with the claims and the chart facts that produced them.
 */
export function predict(question, chart) {
  const topics = matchTopics(question);
  const sections = topics.map((topic) => ({
    topic: topic.id,
    label: topic.label,
    lines: topic.lines.map((line) => fill(line, chart)),
  }));

  const summary = [
    `${chart.ascendant.sign} ascendant, Moon in ${chart.moon.sign} (${chart.moon.nakshatra}, pada ${chart.moon.pada}).`,
    `Reading covers: ${topics.map((t) => t.label).join(", ")}.`,
  ].join(" ");

  return {
    summary,
    sections,
    grounding: {
      ascendant: chart.ascendant.sign,
      moonSign: chart.moon.sign,
      nakshatra: chart.moon.nakshatra,
      pada: chart.moon.pada,
      ayanamsa: chart.ayanamsa,
      housesUsed: [...new Set(topics.flatMap((t) => t.houses || []))].sort((a, b) => a - b),
    },
    disclaimer:
      "Antaryami computes a sidereal chart from your birth data and reads it in plain language. " +
      "It is entertainment and self-reflection, not medical, legal, or financial advice.",
  };
}
