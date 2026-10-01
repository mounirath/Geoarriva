/**
 * Système d'internationalisation (Français, Anglais, Arabe)
 * et gestion de la direction de lecture (LTR / RTL).
 */

export type Language = 'fr' | 'en' | 'ar';
export type TextSize = 'normal' | 'large' | 'xlarge';

export interface Translations {
  appName: string;
  tagline: string;
  noAccountRequired: string;
  googleMaps: string;
  osm: string;
  ringtones: string;
  favorites: string;
  textSize: string;
  normalText: string;
  largeText: string;
  xlargeText: string;
  clear: string;
  demoBadge: string;
  searchPlaceholder: string;
  searchNoResults: string;
  frequentStops: string;
  gpsBlockedFallback: string;
  gpsNotSupported: string;
  tapMapToSetDest: string;
  locateMe: string;
  goToDest: string;
  fitView: string;
  changeMapStyle: string;
  waitingForDeparture: string;
  trackingActive: string;
  trackingSimActive: string;
  testAlarm: string;
  adjustRadius: string;
  distanceLabel: string;
  speedLabel: string;
  etaLabel: string;
  immediateArrival: string;
  tapMapOrSearchHint: string;
  startTracking: string;
  stopTracking: string;
  stepForward: string;
  simulateTrip: string;
  disableSimulation: string;
  screenKeptAwake: string;
  wakeUpUrgent: string;
  approachingDest: string;
  estimatedRemainingDist: string;
  insideConfiguredRadius: string;
  stopAlarmAndTracking: string;
  soundMuted: string;
  soundActive: string;
  soundsModalTitle: string;
  soundsModalSubtitle: string;
  alarmVolume: string;
  confirmSound: string;
  listenPreview: string;
  favModalTitle: string;
  favModalSubtitle: string;
  saveCurrentDest: string;
  destOnMapLabel: string;
  favNamePlaceholder: string;
  cancel: string;
  confirm: string;
  noFavsSaved: string;
  selectedPoint: string;
  arrivalPoint: string;
  radiusSelectorTitle: string;
  veryShortAlert: string;
  urbanTransitIdeal: string;
  fastTrainIdeal: string;
  tipMetro: string;
  tipBus: string;
  tipSuburban: string;
  tipTrain: string;
  tipHighSpeed: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  fr: {
    appName: 'TransitAlarm',
    tagline: "Alerte d'arrivée GPS",
    noAccountRequired: 'Sans compte ni inscription',
    googleMaps: 'Google Maps',
    osm: 'OSM',
    ringtones: 'Sonneries',
    favorites: 'Favoris',
    textSize: 'Taille du texte',
    normalText: 'Normal',
    largeText: 'Grand',
    xlargeText: 'Très grand',
    clear: 'Effacer',
    demoBadge: 'Mode Démo',
    searchPlaceholder: 'Rechercher une gare, arrêt ou adresse...',
    searchNoResults: 'Aucun résultat trouvé. Touchez directement la carte.',
    frequentStops: "Points d'intérêt fréquents",
    gpsBlockedFallback: 'Position GPS non accessible ou bloquée. Utilisation de la position de test.',
    gpsNotSupported: "La géolocalisation n'est pas supportée par ce navigateur.",
    tapMapToSetDest: 'Touchez la carte pour placer votre destination',
    locateMe: 'Me localiser',
    goToDest: 'Aller à la destination',
    fitView: 'Ajuster la vue du trajet',
    changeMapStyle: 'Changer le style de carte',
    waitingForDeparture: 'En attente de départ',
    trackingActive: 'Suivi GPS actif',
    trackingSimActive: 'Suivi actif (Simulation)',
    testAlarm: "Tester l'alarme",
    adjustRadius: "Ajuster le rayon d'alerte",
    distanceLabel: 'Distance',
    speedLabel: 'Vitesse',
    etaLabel: 'Arrivée',
    immediateArrival: 'Arrivée immédiate',
    tapMapOrSearchHint: "Touchez la carte ou cherchez une adresse pour définir votre arrêt d'arrivée",
    startTracking: 'Démarrer le suivi du trajet',
    stopTracking: 'Arrêter le suivi',
    stepForward: 'Avancer (Test)',
    simulateTrip: 'Simuler un trajet (démo)',
    disableSimulation: 'Désactiver le simulateur',
    screenKeptAwake: 'Écran maintenu allumé',
    wakeUpUrgent: 'RÉVEILLEZ-VOUS !',
    approachingDest: 'Vous arrivez à destination',
    estimatedRemainingDist: 'Distance restante estimée',
    insideConfiguredRadius: "Dans la zone d'alerte configurée à",
    stopAlarmAndTracking: "Arrêter l'alarme et le suivi",
    soundMuted: 'Son coupé',
    soundActive: 'Son actif',
    soundsModalTitle: "Sons & Sonneries d'alarme",
    soundsModalSubtitle: "Personnalisez la sonnerie du réveil d'arrivée",
    alarmVolume: "Volume de l'alarme",
    confirmSound: 'Confirmer la sonnerie',
    listenPreview: 'Écouter un extrait',
    favModalTitle: 'Arrêts & Trajets favoris',
    favModalSubtitle: 'Accès direct à vos destinations habituelles',
    saveCurrentDest: 'Enregistrer',
    destOnMapLabel: 'Destination sur la carte',
    favNamePlaceholder: 'Nom du favori (ex: Domicile, Gare...)',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    noFavsSaved: "Aucun arrêt favori enregistré. Sélectionnez un point sur la carte pour l'ajouter.",
    selectedPoint: 'Point sélectionné',
    arrivalPoint: "Point d'arrivée",
    radiusSelectorTitle: "Rayon d'alerte avant l'arrivée",
    veryShortAlert: 'Alerte très courte',
    urbanTransitIdeal: 'Idéal pour le transport urbain',
    fastTrainIdeal: 'Idéal pour train rapide',
    tipMetro: 'Métro / Tram',
    tipBus: 'Bus urbain',
    tipSuburban: 'RER / Banlieue',
    tipTrain: 'TER / Train',
    tipHighSpeed: 'TGV / Express',
  },
  en: {
    appName: 'TransitAlarm',
    tagline: 'GPS Arrival Alert',
    noAccountRequired: 'No account needed',
    googleMaps: 'Google Maps',
    osm: 'OSM',
    ringtones: 'Ringtones',
    favorites: 'Favorites',
    textSize: 'Text Size',
    normalText: 'Normal',
    largeText: 'Large',
    xlargeText: 'Extra Large',
    clear: 'Clear',
    demoBadge: 'Demo Mode',
    searchPlaceholder: 'Search for a station, stop or address...',
    searchNoResults: 'No results found. Tap directly on the map.',
    frequentStops: 'Frequent transit spots',
    gpsBlockedFallback: 'GPS access denied or unavailable. Using demo position.',
    gpsNotSupported: 'Geolocation is not supported by your browser.',
    tapMapToSetDest: 'Tap anywhere on the map to set your destination',
    locateMe: 'Locate me',
    goToDest: 'Go to destination',
    fitView: 'Fit trip bounds',
    changeMapStyle: 'Toggle map view',
    waitingForDeparture: 'Ready for departure',
    trackingActive: 'GPS tracking active',
    trackingSimActive: 'Tracking active (Demo)',
    testAlarm: 'Test alarm',
    adjustRadius: 'Adjust alert radius',
    distanceLabel: 'Distance',
    speedLabel: 'Speed',
    etaLabel: 'Arrival',
    immediateArrival: 'Arriving now',
    tapMapOrSearchHint: 'Tap the map or search an address to set your destination stop',
    startTracking: 'Start trip tracking',
    stopTracking: 'Stop tracking',
    stepForward: 'Step forward (Test)',
    simulateTrip: 'Simulate trip (demo)',
    disableSimulation: 'Disable simulation',
    screenKeptAwake: 'Screen kept awake',
    wakeUpUrgent: 'WAKE UP!',
    approachingDest: 'Approaching your destination',
    estimatedRemainingDist: 'Estimated remaining distance',
    insideConfiguredRadius: 'Inside alert perimeter set to',
    stopAlarmAndTracking: 'Stop alarm & tracking',
    soundMuted: 'Muted',
    soundActive: 'Sound active',
    soundsModalTitle: 'Alarm Sounds & Ringtones',
    soundsModalSubtitle: 'Customize your transit wake-up alarm sound',
    alarmVolume: 'Alarm volume',
    confirmSound: 'Confirm sound',
    listenPreview: 'Preview sound',
    favModalTitle: 'Favorite Stops & Trips',
    favModalSubtitle: 'Quick access to your usual transit destinations',
    saveCurrentDest: 'Save',
    destOnMapLabel: 'Destination on map',
    favNamePlaceholder: 'Favorite name (e.g. Home, Office, Station...)',
    cancel: 'Cancel',
    confirm: 'Confirm',
    noFavsSaved: 'No favorite stops saved yet. Select a point on the map to add it.',
    selectedPoint: 'Selected point',
    arrivalPoint: 'Arrival stop',
    radiusSelectorTitle: 'Alert radius before arrival',
    veryShortAlert: 'Short alert distance',
    urbanTransitIdeal: 'Ideal for metro & urban transit',
    fastTrainIdeal: 'Ideal for high-speed train',
    tipMetro: 'Metro / Tram',
    tipBus: 'City Bus',
    tipSuburban: 'Suburban / Commuter',
    tipTrain: 'Regional Train',
    tipHighSpeed: 'High Speed Train',
  },
  ar: {
    appName: 'منبه الترانزيت',
    tagline: 'منبه الوصول عبر GPS',
    noAccountRequired: 'بدون تسجيل أو حساب',
    googleMaps: 'خرائط جوجل',
    osm: 'OSM',
    ringtones: 'النغمات',
    favorites: 'المفضلة',
    textSize: 'حجم الخط',
    normalText: 'عادي',
    largeText: 'كبير',
    xlargeText: 'كبير جداً',
    clear: 'مسح',
    demoBadge: 'وضع تجريبي',
    searchPlaceholder: 'ابحث عن محطة قطار، حافلة أو عنوان...',
    searchNoResults: 'لم يتم العثور على نتائج. المس الخريطة مباشرة.',
    frequentStops: 'محطات ووجهات شائعة',
    gpsBlockedFallback: 'تعذر الوصول إلى الموقع GPS. يتم استخدام موقع تجريبي.',
    gpsNotSupported: 'المتصفح لا يدعم تحديد الموقع الجغرافي.',
    tapMapToSetDest: 'المس أي مكان على الخريطة لتحديد وجهتك',
    locateMe: 'موقعي الحالي',
    goToDest: 'الذهاب إلى الوجهة',
    fitView: 'عرض المسار كاملاً',
    changeMapStyle: 'تغيير مظهر الخريطة',
    waitingForDeparture: 'في انتظار الانطلاق',
    trackingActive: 'تتبع GPS نشط',
    trackingSimActive: 'تتبع نشط (محاكاة)',
    testAlarm: 'تجربة المنبه',
    adjustRadius: 'تعديل نطاق التنبيه',
    distanceLabel: 'المسافة',
    speedLabel: 'السرعة',
    etaLabel: 'الوصول',
    immediateArrival: 'وصول وشيك',
    tapMapOrSearchHint: 'المس الخريطة أو ابحث عن عنوان لتحديد محطة الوصول',
    startTracking: 'بدء تتبع الرحلة',
    stopTracking: 'إيقاف التتبع',
    stepForward: 'تقدم خطوة (تجربة)',
    simulateTrip: 'محاكاة رحلة (تجريبي)',
    disableSimulation: 'إيقاف المحاكاة',
    screenKeptAwake: 'الشاشة قيد التشغيل دائمًا',
    wakeUpUrgent: '!استيقظ فورا',
    approachingDest: 'أنت تقترب من وجهتك',
    estimatedRemainingDist: 'المسافة المتبقية التقديرية',
    insideConfiguredRadius: 'داخل نطاق التنبيه المحدد بـ',
    stopAlarmAndTracking: 'إيقاف المنبه والتتبع',
    soundMuted: 'كتم الصوت',
    soundActive: 'الصوت نشط',
    soundsModalTitle: 'نغمات وأصوات التنبيه',
    soundsModalSubtitle: 'خصص نغمة التنبيه الخاصة بوصولك',
    alarmVolume: 'مستوى صوت المنبه',
    confirmSound: 'تأكيد النغمة',
    listenPreview: 'استماع للمقطع',
    favModalTitle: 'المحطات والوجهات المفضلة',
    favModalSubtitle: 'وصول سريع إلى وجهاتك ومحطاتك اليومية',
    saveCurrentDest: 'حفظ',
    destOnMapLabel: 'الوجهة المحددة على الخريطة',
    favNamePlaceholder: 'اسم الوجهة (مثال: المنزل، العمل، المحطة...)',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    noFavsSaved: 'لا توجد محطات مفضلة محفوظة بعد. اختر نقطة على الخريطة لإضافتها.',
    selectedPoint: 'النقطة المحددة',
    arrivalPoint: 'نقطة الوصول',
    radiusSelectorTitle: 'نطاق التنبيه قبل الوصول',
    veryShortAlert: 'تنبيه لمسافة قصيرة جداً',
    urbanTransitIdeal: 'مثالي للمترو والترام والحافلات',
    fastTrainIdeal: 'مثالي للقطارات السريعة',
    tipMetro: 'مترو / ترام',
    tipBus: 'حافلة نقل',
    tipSuburban: 'قطار ضواحي',
    tipTrain: 'قطار إقليمي',
    tipHighSpeed: 'قطار فائق السرعة',
  },
};
