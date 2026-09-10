import { createContext, useContext, useState, useCallback } from 'react';

const LanguageContext = createContext(null);

const translations = {
  en: {
    // Nav
    home: 'Home',
    findStay: 'Find a Stay',
    myTrips: 'My Trips',
    wishlist: 'Wishlist',
    rewards: 'Rewards',
    profile: 'Profile',
    logout: 'Logout',
    language: 'Language',

    // Home hero
    heroSubtitle: 'Bespoke Hospitality',
    heroTitle1: 'Discover your next',
    heroTitle2: 'extraordinary stay.',
    heroPlaceholder: 'Where would you like to go? (e.g. Goa, Mumbai...)',
    explore: 'Explore',

    // How it works
    theProcess: 'The Process',
    curatedJourney: 'A Curated Journey',
    curatedDesc: "We've refined the booking experience. Tell us your desires, and allow premier properties to present their finest offerings.",
    step1Title: 'Define Your Desires',
    step1Desc: 'Detail your ideal destination, dates, and bespoke preferences through our intuitive interface.',
    step2Title: 'Curated Offers',
    step2Desc: 'Matched luxury properties will present personalized quotes, allowing you to select the perfect fit.',
    step3Title: 'Seamless Arrival',
    step3Desc: 'Secure your booking and experience frictionless, digital check-in via your exclusive QR pass.',

    // Featured
    collection: 'Collection',
    featuredProperties: 'Featured Properties',
    viewPortfolio: 'View Portfolio',
    perNight: '/ Night',
    reviews: 'reviews',

    // CTA
    readyToEscape: 'Ready to escape?',
    ctaDesc: 'Submit your requirements and let our premier properties compete to host your next unforgettable stay.',
    beginJourney: 'Begin Your Journey',

    // Footer
    footerText: '© 2026 HostIQ. Curated Luxury Stays.',

    // Rewards
    rewardsStore: 'Rewards Store',
    yourPoints: 'Your Points',
    redeemableRewards: 'Redeemable Rewards',
    redeem: 'Redeem',
    redeemed: 'Redeemed!',
    notEnoughPoints: 'Not enough points',
    pts: 'pts',
    redemptionHistory: 'Redemption History',
    noRedemptions: 'No redemptions yet. Earn points by checking in!',
    earnMore: 'Earn 100 points on every hotel check-in',

    // Dark mode
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
  },

  hi: {
    home: 'होम',
    findStay: 'होटल खोजें',
    myTrips: 'मेरी यात्राएँ',
    wishlist: 'पसंदीदा',
    rewards: 'रिवॉर्ड्स',
    profile: 'प्रोफ़ाइल',
    logout: 'लॉगआउट',
    language: 'भाषा',

    heroSubtitle: 'बेहतरीन आतिथ्य',
    heroTitle1: 'अपना अगला',
    heroTitle2: 'असाधारण ठहराव खोजें।',
    heroPlaceholder: 'आप कहाँ जाना चाहेंगे? (जैसे गोवा, मुंबई...)',
    explore: 'खोजें',

    theProcess: 'प्रक्रिया',
    curatedJourney: 'एक क्यूरेटेड यात्रा',
    curatedDesc: 'हमने बुकिंग अनुभव को बेहतर बनाया है। अपनी इच्छाएँ बताएं और प्रीमियम प्रॉपर्टीज़ को अपने बेहतरीन ऑफर पेश करने दें।',
    step1Title: 'अपनी इच्छाएँ बताएं',
    step1Desc: 'हमारे सहज इंटरफ़ेस के माध्यम से अपनी आदर्श मंजिल, तिथियाँ और प्राथमिकताएँ विस्तार से बताएं।',
    step2Title: 'क्यूरेटेड ऑफर',
    step2Desc: 'मिलान किए गए लग्जरी प्रॉपर्टीज़ व्यक्तिगत कोटेशन प्रस्तुत करेंगे, जिससे आप सही विकल्प चुन सकें।',
    step3Title: 'सहज आगमन',
    step3Desc: 'अपनी बुकिंग सुरक्षित करें और अपने विशेष QR पास के माध्यम से डिजिटल चेक-इन का अनुभव करें।',

    collection: 'संग्रह',
    featuredProperties: 'विशेष प्रॉपर्टीज़',
    viewPortfolio: 'पोर्टफोलियो देखें',
    perNight: '/ रात',
    reviews: 'समीक्षाएँ',

    readyToEscape: 'तैयार हैं?',
    ctaDesc: 'अपनी आवश्यकताएँ भेजें और हमारी प्रीमियम प्रॉपर्टीज़ को आपके अगले यादगार ठहराव के लिए प्रतिस्पर्धा करने दें।',
    beginJourney: 'अपनी यात्रा शुरू करें',

    footerText: '© 2026 HostIQ। क्यूरेटेड लग्जरी ठहराव।',

    rewardsStore: 'रिवॉर्ड्स स्टोर',
    yourPoints: 'आपके पॉइंट्स',
    redeemableRewards: 'रिडीम करने योग्य रिवॉर्ड्स',
    redeem: 'रिडीम करें',
    redeemed: 'रिडीम हो गया!',
    notEnoughPoints: 'पर्याप्त पॉइंट्स नहीं',
    pts: 'पॉइंट्स',
    redemptionHistory: 'रिडेम्पशन इतिहास',
    noRedemptions: 'अभी तक कोई रिडेम्पशन नहीं। चेक-इन करके पॉइंट्स कमाएँ!',
    earnMore: 'हर होटल चेक-इन पर 100 पॉइंट्स कमाएँ',

    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
  },

  te: {
    home: 'హోమ్',
    findStay: 'హోటల్ వెతకండి',
    myTrips: 'నా ట్రిప్స్',
    wishlist: 'విష్‌లిస్ట్',
    rewards: 'రివార్డ్స్',
    profile: 'ప్రొఫైల్',
    logout: 'లాగ్ అవుట్',
    language: 'భాష',

    heroSubtitle: 'ప్రత్యేక ఆతిథ్యం',
    heroTitle1: 'మీ తదుపరి',
    heroTitle2: 'అసాధారణ బస కనుగొనండి.',
    heroPlaceholder: 'మీరు ఎక్కడికి వెళ్లాలనుకుంటున్నారు? (ఉదా. గోవా, ముంబై...)',
    explore: 'అన్వేషించండి',

    theProcess: 'ప్రక్రియ',
    curatedJourney: 'క్యూరేటెడ్ ప్రయాణం',
    curatedDesc: 'మేము బుకింగ్ అనుభవాన్ని మెరుగుపరిచాము. మీ కోరికలు చెప్పండి, ప్రీమియం ప్రాపర్టీలు తమ ఉత్తమ ఆఫర్లను అందించనివ్వండి.',
    step1Title: 'మీ కోరికలు నిర్వచించండి',
    step1Desc: 'మా సహజ ఇంటర్‌ఫేస్ ద్వారా మీ ఆదర్శ గమ్యస్థానం, తేదీలు మరియు ప్రాధాన్యతలను వివరంగా తెలపండి.',
    step2Title: 'క్యూరేటెడ్ ఆఫర్లు',
    step2Desc: 'సరిపోలిన లగ్జరీ ప్రాపర్టీలు వ్యక్తిగత కోట్‌లను అందిస్తాయి, సరైన ఎంపిక చేసుకోవడానికి.',
    step3Title: 'సజావుగా రాక',
    step3Desc: 'మీ బుకింగ్ భద్రపరచండి మరియు మీ ప్రత్యేక QR పాస్ ద్వారా డిజిటల్ చెక్-ఇన్ అనుభవించండి.',

    collection: 'సేకరణ',
    featuredProperties: 'ఫీచర్డ్ ప్రాపర్టీలు',
    viewPortfolio: 'పోర్ట్‌ఫోలియో చూడండి',
    perNight: '/ రాత్రి',
    reviews: 'సమీక్షలు',

    readyToEscape: 'సిద్ధంగా ఉన్నారా?',
    ctaDesc: 'మీ అవసరాలను సమర్పించండి మరియు మా ప్రీమియం ప్రాపర్టీలు మీ తదుపరి మరపురాని బస కోసం పోటీపడనివ్వండి.',
    beginJourney: 'మీ ప్రయాణం ప్రారంభించండి',

    footerText: '© 2026 HostIQ. క్యూరేటెడ్ లగ్జరీ బస.',

    rewardsStore: 'రివార్డ్స్ స్టోర్',
    yourPoints: 'మీ పాయింట్లు',
    redeemableRewards: 'రిడీమ్ చేయగల రివార్డ్స్',
    redeem: 'రిడీమ్ చేయండి',
    redeemed: 'రిడీమ్ అయింది!',
    notEnoughPoints: 'సరిపోయే పాయింట్లు లేవు',
    pts: 'పాయింట్లు',
    redemptionHistory: 'రిడెంప్షన్ చరిత్ర',
    noRedemptions: 'ఇంకా రిడెంప్షన్‌లు లేవు. చెక్-ఇన్ చేసి పాయింట్లు సంపాదించండి!',
    earnMore: 'ప్రతి హోటల్ చెక్-ఇన్‌లో 100 పాయింట్లు సంపాదించండి',

    darkMode: 'డార్క్ మోడ్',
    lightMode: 'లైట్ మోడ్',
  }
};

const LANG_LABELS = {
  en: 'EN',
  hi: 'हिं',
  te: 'తె',
};

const LANG_NAMES = {
  en: 'English',
  hi: 'हिन्दी',
  te: 'తెలుగు',
};

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try { return localStorage.getItem('hostiq_lang') || 'en'; } catch { return 'en'; }
  });

  const setLang = useCallback((newLang) => {
    setLangState(newLang);
    try { localStorage.setItem('hostiq_lang', newLang); } catch {}
  }, []);

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, LANG_LABELS, LANG_NAMES }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
