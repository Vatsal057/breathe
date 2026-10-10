/**
 * The 12-level angul table from the Shiv Swarodaya chart
 * ("Prana Vayu — Kya Hai Aur Iski Gati").
 *
 * This is a READING text: traditional claims, shown not tracked.
 * No row is linked to any measurement, level, or reward in the app.
 * For provenance: the table is in the root text (Rama Prasad
 * translation, 1894, vv. 219–222); the chart's own diagrams and
 * groupings are the chart-maker's.
 */

export interface AngulLevel {
  level: number;
  hindi: string;
  english: string;
}

export const ANGUL_SOURCE_NOTE =
  'From the Shiv Swarodaya (Rama Prasad translation, 1894, vv. 216–222). Traditional claims — shown, not tracked.';

export const ANGUL_PATH: AngulLevel[] = [
  { level: 1, hindi: 'निष्कामता', english: 'desirelessness' },
  { level: 2, hindi: 'आनंद', english: 'bliss' },
  { level: 3, hindi: 'कविता की प्राप्ति', english: 'mastery of poetry' },
  { level: 4, hindi: 'वाणी की सिद्धि', english: 'mastery of speech' },
];

export const ANGUL_BEYOND: AngulLevel[] = [
  { level: 5, hindi: 'दूरदृष्टि', english: 'clairvoyance, far sight' },
  { level: 6, hindi: 'आकाश गमन की शक्ति', english: 'power of sky travel' },
  { level: 7, hindi: 'प्रचंड वेग', english: 'immense speed' },
  { level: 8, hindi: 'अणिमा आदि सिद्धियाँ', english: 'anima and the classic yogic powers' },
  { level: 9, hindi: 'नौ निधियों की प्राप्ति', english: 'the nine treasures' },
  { level: 10, hindi: 'दसों मूर्तियों की प्राप्ति', english: 'ten forms, many bodies at once' },
  { level: 11, hindi: 'देह की छाया का अभाव', english: 'the body casts no shadow' },
  {
    level: 12,
    hindi: 'हंस गति, गंगा जल के समान अमृत रस का पान',
    english: 'swan-like movement, drinking nectar like Ganga water',
  },
];
