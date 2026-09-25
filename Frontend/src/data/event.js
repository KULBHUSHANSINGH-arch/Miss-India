// All event content lives here — edit this file to update the website text.

export const EVENT = {
  presentedBy: 'Vaibhav Jan Samriddhi Foundation',
  partner: 'Nbosecsm Education Foundation',
  title: "Global India's Biggest Beauty Pageant",
  subtitle: 'Mr. Miss. & Mrs. India 2026',
  tagline: "A Premium Beauty Pageant & Fashion Show for Fresher's & Professional Models",
  ageGroup: '15 to 45 Years',
  fee: 'Applicable',
  includes: ['Grooming', 'Designer Outfits', 'Professional Makeup', 'Food'],
  auditionDate: '25 November 2026',
  finaleDate: '18 December 2026',
  finaleISO: '2026-12-18T00:00:00+05:30',
  venue: '5 Star Radisson Hotel',
  city: 'Agra',
  phones: ['+91 8126336547', '+91 9675026934'],
  whatsapp: '918126336547',
  tourNote:
    'All the male and female celebrities and contestants will visit the Taj Mahal and the Agra Fort. They will also be taken to see Mathura and Vrindavan.',
  feeNote:
    'Registration fees are Non-Refundable and Non-Transferable once the registration is confirmed.',
  experiences: ['LIVE Coverage', 'Exclusive Red Carpet', 'Glam & Glory Experience'],
};

export const HIGHLIGHTS = [
  { title: '2 Exciting Rounds', text: 'Showcase your walk, poise and personality across two competitive rounds.' },
  { title: '2 Designer Outfits', text: 'Provided by the organizers — styled for the ramp and the spotlight.' },
  { title: 'Professional Makeup', text: 'Provided by the organizers — camera-ready looks by professional artists.' },
];

export const WINNER_BENEFITS = [
  'Crown Presented by Celebrity',
  'Award Presented by Celebrity',
  'Winner Sash',
  'Certificate of Achievement',
  'Complimentary Professional Brand Ambassador Contract',
  'Portfolio Photo Shoot',
  'Webseries',
  'Tele Film',
  'Music Album',
  'Exclusive Return Gift',
];

export const RUNNER_UP_BENEFITS = ['Award & Certificate of Achievement (Presented by the Organizers)'];

export const GUESTS = [
  { label: 'Celebrity Guest', name: 'To be announced', role: 'Bollywood Actress' },
  { label: 'Chief Guest', name: 'To be announced', role: "Hon'ble Deputy CM, Cabinet Ministers etc." },
];

export const TIMELINE = [
  { date: 'Now Open', title: 'Registrations', text: 'Register online in two minutes and receive your Registration ID instantly.' },
  { date: '25 Nov 2026', title: 'Live Audition / Grooming', text: 'Meet the mentors, walk the audition ramp and begin grooming.' },
  { date: 'Before Finale', title: 'Heritage Tour', text: 'Taj Mahal, Agra Fort, Mathura & Vrindavan with celebrities and fellow contestants.' },
  { date: '18 Dec 2026', title: 'Grand Finale', text: 'Red carpet, live coverage and the crowning moment at Radisson Hotel, Agra.' },
];

// width/height are the real pixel sizes — used to stop images rendering bigger than their source.
export const IMAGES = {
  runwayBlue: { src: '/images/runway-blue.jpeg', w: 853, h: 1280, alt: 'Miss India 2026 walking the ramp in a royal blue gown' },
  runwayBlush: { src: '/images/runway-blush.jpeg', w: 853, h: 1280, alt: 'Miss India 2026 in a blush pink embellished outfit on the runway' },
  runwayWine: { src: '/images/runway-wine.jpeg', w: 853, h: 1280, alt: 'Miss India 2026 in a wine embroidered gown with cape' },
  sashQueen: { src: '/images/sash-queen.jpeg', w: 720, h: 891, alt: 'Pageant queen with crown holding her collection of winner sashes' },
  posterMissMrs: { src: '/images/poster-miss-mrs.jpeg', w: 1024, h: 1536, alt: 'Miss India & Mrs. India 2026 official poster' },
  posterBusinessIcon: { src: '/images/poster-business-icon.jpeg', w: 853, h: 1280, alt: 'International Business Icon Awards 2026 and Mr. Miss. & Mrs. India poster' },
  posterInvitation: { src: '/images/poster-invitation.jpeg', w: 843, h: 1264, alt: 'Grand Finale invitation poster' },
  posterMrMrs: { src: '/images/poster-mr-mrs.jpeg', w: 853, h: 1280, alt: 'Mr. India & Mrs. India 2026 poster' },
};

export const GALLERY = [
  { ...IMAGES.runwayBlue, tag: 'Runway' },
  { ...IMAGES.posterMissMrs, tag: 'Poster' },
  { ...IMAGES.runwayBlush, tag: 'Runway' },
  { ...IMAGES.sashQueen, tag: 'Crowning' },
  { ...IMAGES.posterBusinessIcon, tag: 'Poster' },
  { ...IMAGES.runwayWine, tag: 'Runway' },
  { ...IMAGES.posterInvitation, tag: 'Poster' },
  { ...IMAGES.posterMrMrs, tag: 'Poster' },
];

export const STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur',
  'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman & Nicobar', 'Chandigarh',
  'Dadra & Nagar Haveli and Daman & Diu', 'Delhi', 'Jammu & Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];

export const CATEGORIES = [
  { value: 'Miss India', note: 'Unmarried women', gender: 'Female' },
  { value: 'Mrs. India', note: 'Married women', gender: 'Female' },
  { value: 'Mr. India', note: 'Men', gender: 'Male' },
];

// Enquiry form: visitors only pick from these (no free typing). Each topic has a ready answer
// shown right after they submit. Keep the topic names in sync with Backend/index.js.
export const ENQUIRY_TOPICS = [
  {
    topic: 'Registration process & fee',
    answer: [
      'Fill the online registration form and get your Registration ID instantly.',
      `Registration fee: ${EVENT.fee}. It includes ${EVENT.includes.join(', ')}.`,
      'Our team calls you to confirm your slot and share payment details.',
    ],
  },
  {
    topic: 'Eligibility & age criteria',
    answer: [
      `Open to freshers and professional models aged ${EVENT.ageGroup}.`,
      'Miss India — unmarried women · Mrs. India — married women · Mr. India — men.',
      'Participants below 18 need parent / guardian consent.',
    ],
  },
  {
    topic: 'Audition & grooming dates',
    answer: [
      `Live Audition / Grooming: ${EVENT.auditionDate}.`,
      `Grand Finale: ${EVENT.finaleDate}.`,
      'Your exact reporting time is shared on call / WhatsApp after registration.',
    ],
  },
  {
    topic: 'Venue, stay & travel',
    answer: [
      `Venue: ${EVENT.venue}, ${EVENT.city}.`,
      EVENT.tourNote,
    ],
  },
  {
    topic: 'Winner prizes & benefits',
    answer: [
      'Crown & award presented by a celebrity, winner sash and certificate of achievement.',
      'Brand ambassador contract, portfolio shoot, web series, tele film and music album opportunities.',
      'Runners-up receive an award & certificate of achievement.',
    ],
  },
  {
    topic: 'Sponsorship / partnership',
    answer: [
      'We partner with brands for title, powered-by, gifting and media sponsorships.',
      'Our partnerships team will call you with the sponsorship deck.',
    ],
  },
  {
    topic: 'Creator / media collaboration',
    answer: [
      `${EVENT.presentedBy} invites Instagram, Facebook & YouTube creators to collaborate.`,
      'Our team will call you to discuss coverage and collaboration.',
    ],
  },
  {
    topic: 'Please call me back',
    answer: ['Our team will call you back shortly on the number you shared.'],
  },
];

export const ENQUIRY_INTERESTS = ['Miss India', 'Mrs. India', 'Mr. India', 'Just exploring'];

export const BLOG_CATEGORIES =['Announcements', 'Events', 'Experiences', 'Beauty & Grooming', 'Fashion', 'Winners', 'Behind the Scenes'];
