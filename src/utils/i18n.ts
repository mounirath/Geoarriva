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
  admobTitle: string;
  admobSubtitle: string;
  advertisement: string;
  adMobBanner: string;
  adClientId: string;
  adSlotId: string;
  saveAdConfig: string;
  adConfigSaved: string;
  adMobTestNotice: string;
  closeAd: string;
  locPermissionRequiredTitle: string;
  locPermissionRequiredDesc: string;
  locPermissionDeniedTitle: string;
  locPermissionDeniedDesc: string;
  locPermissionDeniedInstructions: string;
  locAuthorizeBtn: string;
  locRetryBtn: string;
  locAcquiringPosition: string;
  locChromeAndroidTip: string;
  locSafariTip: string;
  locErrorTimeout: string;
  locErrorUnavailable: string;
  locActiveGpsBadge: string;
  addFavorite: string;
  addNewFavorite: string;
  favSearchAddress: string;
  favAddedSuccess: string;
  favAlreadyExists: string;
  chooseOnMapOrSearch: string;
  appOpenAdTitle: string;
  appOpenAdDesc: string;
  skipAd: string;
  adMobAppOpenBadge: string;
  continueToApp: string;
  testAppOpenAd: string;
  menu: string;
  openMenu: string;
  closeMenu: string;
  navigation: string;
  aboutApp: string;
  gpsDiagnostic: string;
  routeLineTrace: string;
  showRouteLine: string;
  hideRouteLine: string;
  routeActiveNotice: string;
  roadRoute: string;
  directRoute: string;
  busTraceHistory: string;
  busLines: string;
  busLineNumber: string;
  busLinePlaceholder: string;
  recordBusTrip: string;
  saveTrace: string;
  traceSavedSuccess: string;
  viewBusTraceOnMap: string;
  clearBusTraceFromMap: string;
  activeBusTrace: string;
  manualAddBusTrace: string;
  exportGpx: string;
  exportGeoJson: string;
  noBusTraces: string;
  noBusTracesDesc: string;
  traceDuration: string;
  traceDistance: string;
  traceAvgSpeed: string;
  startPoint: string;
  arrivalTerminus: string;
  setAsDestination: string;
  deleteTraceConfirm: string;
  resetSampleTraces: string;
  close: string;
  delete: string;
  vibrationMode: string;
  vibrationPatternsTitle: string;
  vibrationPatternsSubtitle: string;
  pocketAlertNotice: string;
  testVibration: string;
  vibrationTesting: string;
  vibrationNotSupported: string;
  soundTestBtn: string;
  soundTab: string;
  vibrationTab: string;
  alarmActiveNotice: string;
  clickToUnlockAudio: string;
  closestFirst: string;
  nearestBadge: string;
  showGpsOnMap: string;
  gpsCentered: string;
  gpsNotDetectedPrompt: string;
  enableTestGpsLocation: string;
}

export const TRANSLATIONS: Record<Language, Translations> = {
  fr: {
    appName: 'arreva',
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
    admobTitle: 'Configuration AdMob / Publicité',
    admobSubtitle: 'Identifiants de monétisation Google AdMob / AdSense',
    advertisement: 'Sponsorisé',
    adMobBanner: 'Bannière AdMob',
    adClientId: 'ID Éditeur (ex: ca-pub-XXXXXXXXXXXXXXXX)',
    adSlotId: "ID Bloc d'annonces (ex: 1234567890)",
    saveAdConfig: 'Enregistrer la configuration',
    adConfigSaved: 'Configuration AdMob enregistrée',
    adMobTestNotice: 'Bannière active au format standard mobile 320x50',
    closeAd: 'Fermer',
    locPermissionRequiredTitle: 'Position GPS Requise',
    locPermissionRequiredDesc: "arreva nécessite impérativement l'accès à votre position GPS pour calculer la distance restante et déclencher votre réveil à l'approche de votre arrêt.",
    locPermissionDeniedTitle: 'Accès GPS Bloqué ou Refusé',
    locPermissionDeniedDesc: "L'autorisation de géolocalisation a été refusée ou désactivée. Sans GPS réel, l'application ne peut pas vous réveiller automatiquement à l'arrivée.",
    locPermissionDeniedInstructions: "Pour réactiver le GPS : appuyez sur l'icône de cadenas ou paramètres du site à gauche de l'adresse, choisissez 'Autorisations', puis activez 'Localisation'.",
    locAuthorizeBtn: 'Autoriser la localisation',
    locRetryBtn: 'Réessayer',
    locAcquiringPosition: 'Acquisition du signal GPS en cours...',
    locChromeAndroidTip: 'Sur Chrome Android : Touchez les paramètres du site (icône cadenas) > Autorisations > Localisation > Autoriser.',
    locSafariTip: 'Sur iPhone / Safari : Allez dans Réglages > Safari > Position > Autoriser.',
    locErrorTimeout: "Délai d'attente dépassé pour capter le signal GPS. Assurez-vous d'avoir une vue dégagée vers le ciel.",
    locErrorUnavailable: 'Signal GPS temporairement indisponible sur votre appareil.',
    locActiveGpsBadge: 'GPS Haute Précision Actif',
    addFavorite: 'Ajouter aux favoris',
    addNewFavorite: 'Ajouter un nouveau favori',
    favSearchAddress: 'Rechercher une adresse ou une station...',
    favAddedSuccess: 'Favori ajouté avec succès !',
    favAlreadyExists: 'Cet arrêt figure déjà dans vos favoris.',
    chooseOnMapOrSearch: 'Rechercher une adresse ou choisir sur la carte',
    appOpenAdTitle: "Annonce à l'ouverture",
    appOpenAdDesc: 'Chargement de vos trajets et réveil GPS en cours...',
    skipAd: "Passer l'annonce",
    adMobAppOpenBadge: 'AdMob · Annonce à l’ouverture',
    continueToApp: 'Accéder à arreva',
    testAppOpenAd: "Tester l'annonce à l'ouverture",
    menu: 'Menu',
    openMenu: 'Ouvrir le menu de navigation',
    closeMenu: 'Fermer le menu de navigation',
    navigation: 'Navigation & Trajets',
    aboutApp: 'À propos de l’application',
    gpsDiagnostic: 'Diagnostic & Signal GPS',
    routeLineTrace: 'Tracé du trajet',
    showRouteLine: 'Afficher le tracé',
    hideRouteLine: 'Masquer le tracé',
    routeActiveNotice: 'Tracé du trajet actif vers la destination',
    roadRoute: 'Itinéraire routier',
    directRoute: 'Ligne directe vol d’oiseau',
    busTraceHistory: 'Historique des tracés de bus',
    busLines: 'Lignes de bus',
    busLineNumber: 'N° de Ligne',
    busLinePlaceholder: 'Ex: 38, 91, 72, N01...',
    recordBusTrip: 'Enregistrer ce tracé de bus',
    saveTrace: 'Enregistrer le tracé',
    traceSavedSuccess: 'Tracé de la ligne de bus enregistré avec succès !',
    viewBusTraceOnMap: 'Afficher sur la carte',
    clearBusTraceFromMap: 'Masquer le tracé affiché',
    activeBusTrace: 'Tracé de bus affiché',
    manualAddBusTrace: 'Ajouter une ligne de bus',
    exportGpx: 'Exporter GPX',
    exportGeoJson: 'Exporter GeoJSON',
    noBusTraces: 'Aucun tracé de ligne de bus enregistré',
    noBusTracesDesc: 'Vos trajets et lignes de bus suivis s’enregistreront automatiquement ici.',
    traceDuration: 'Durée',
    traceDistance: 'Distance',
    traceAvgSpeed: 'Vitesse moy.',
    startPoint: 'Arrêt de départ',
    arrivalTerminus: 'Terminus / Arrivée',
    setAsDestination: 'Définir comme arrivée',
    deleteTraceConfirm: 'Supprimer définitivement ce tracé d’historique ?',
    resetSampleTraces: 'Restaurer exemples',
    close: 'Fermer',
    delete: 'Supprimer',
    vibrationMode: 'Mode de vibration',
    vibrationPatternsTitle: 'Motifs de vibration (Alerte poche)',
    vibrationPatternsSubtitle: 'Optimisé pour ressentir le réveil quand le téléphone est dans une poche ou un sac',
    pocketAlertNotice: 'Motif calibré pour téléphone rangé dans une poche',
    testVibration: 'Tester la vibration',
    vibrationTesting: 'Vibration en cours...',
    vibrationNotSupported: 'Vibration haptique non supportée sur ce navigateur',
    soundTestBtn: "Tester l'alarme sonore",
    soundTab: 'Sonnerie',
    vibrationTab: 'Vibration (Poche)',
    alarmActiveNotice: "L'alarme sonore et la vibration sont activées",
    clickToUnlockAudio: 'Touchez pour activer le son si bloqué par le navigateur',
    closestFirst: 'Les plus proches en premier',
    nearestBadge: 'Plus proche',
    showGpsOnMap: 'Afficher ma position GPS sur la carte',
    gpsCentered: 'Carte centrée sur votre position GPS',
    gpsNotDetectedPrompt: 'Position GPS non encore détectée',
    enableTestGpsLocation: 'Activer la position GPS de test',
  },
  en: {
    appName: 'arreva',
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
    admobTitle: 'AdMob / Ads Configuration',
    admobSubtitle: 'Google AdMob / AdSense monetization IDs',
    advertisement: 'Sponsored',
    adMobBanner: 'AdMob Banner',
    adClientId: 'Publisher ID (e.g. ca-pub-XXXXXXXXXXXXXXXX)',
    adSlotId: 'Ad Unit Slot ID (e.g. 1234567890)',
    saveAdConfig: 'Save Configuration',
    adConfigSaved: 'AdMob configuration saved',
    adMobTestNotice: 'Standard 320x50 Mobile Ad Banner Active',
    closeAd: 'Close',
    locPermissionRequiredTitle: 'GPS Location Required',
    locPermissionRequiredDesc: 'arreva requires access to your real GPS location to calculate the remaining distance and trigger your wake-up alarm as you arrive.',
    locPermissionDeniedTitle: 'GPS Access Denied or Blocked',
    locPermissionDeniedDesc: 'Geolocation permission was denied. Without real GPS, the app cannot accurately track your transit progress or wake you up at your stop.',
    locPermissionDeniedInstructions: "To enable GPS: tap the lock or site settings icon on the left of the address bar, select 'Permissions', then enable 'Location'.",
    locAuthorizeBtn: 'Allow Location',
    locRetryBtn: 'Retry',
    locAcquiringPosition: 'Acquiring GPS fix...',
    locChromeAndroidTip: 'On Chrome Android: Tap site settings (lock icon) > Permissions > Location > Allow.',
    locSafariTip: 'On iPhone / Safari: Go to Settings > Safari > Location > Allow.',
    locErrorTimeout: 'GPS acquisition timed out. Ensure you have a clear view of the sky.',
    locErrorUnavailable: 'GPS position is temporarily unavailable on your device.',
    locActiveGpsBadge: 'High Accuracy GPS Active',
    addFavorite: 'Add to favorites',
    addNewFavorite: 'Add a new favorite',
    favSearchAddress: 'Search an address or station...',
    favAddedSuccess: 'Favorite added successfully!',
    favAlreadyExists: 'This stop is already in your favorites.',
    chooseOnMapOrSearch: 'Search an address or pick on map',
    appOpenAdTitle: 'App Open Ad',
    appOpenAdDesc: 'Loading your trips and transit wake-up alarm...',
    skipAd: 'Skip Ad',
    adMobAppOpenBadge: 'AdMob · App Open Ad',
    continueToApp: 'Continue to arreva',
    testAppOpenAd: 'Test App Open Ad',
    menu: 'Menu',
    openMenu: 'Open navigation menu',
    closeMenu: 'Close navigation menu',
    navigation: 'Navigation & Trips',
    aboutApp: 'About the application',
    gpsDiagnostic: 'GPS Status & Signal Diagnostic',
    routeLineTrace: 'Route Line Trace',
    showRouteLine: 'Show Route Line',
    hideRouteLine: 'Hide Route Line',
    routeActiveNotice: 'Active route trajectory towards destination',
    roadRoute: 'Road itinerary',
    directRoute: 'Direct crow-flies line',
    busTraceHistory: 'Bus Route Trace History',
    busLines: 'Bus Lines',
    busLineNumber: 'Line Number',
    busLinePlaceholder: 'e.g. 38, 91, 72, N01...',
    recordBusTrip: 'Save Bus Trip Trace',
    saveTrace: 'Save Trace',
    traceSavedSuccess: 'Bus line route trace saved successfully!',
    viewBusTraceOnMap: 'Show on Map',
    clearBusTraceFromMap: 'Hide Displayed Route',
    activeBusTrace: 'Displayed Bus Route',
    manualAddBusTrace: 'Add Bus Line',
    exportGpx: 'Export GPX',
    exportGeoJson: 'Export GeoJSON',
    noBusTraces: 'No bus route traces saved',
    noBusTracesDesc: 'Your tracked transit and bus routes will automatically be recorded here.',
    traceDuration: 'Duration',
    traceDistance: 'Distance',
    traceAvgSpeed: 'Avg Speed',
    startPoint: 'Starting Stop',
    arrivalTerminus: 'Terminus / Arrival',
    setAsDestination: 'Set as Arrival',
    deleteTraceConfirm: 'Permanently delete this route trace history?',
    resetSampleTraces: 'Restore Samples',
    close: 'Close',
    delete: 'Delete',
    vibrationMode: 'Vibration Mode',
    vibrationPatternsTitle: 'Vibration Patterns (Pocket Alert)',
    vibrationPatternsSubtitle: 'Optimized to feel the wake-up alert through your pocket, jacket, or bag',
    pocketAlertNotice: 'Pattern calibrated for phones in a pocket',
    testVibration: 'Test vibration',
    vibrationTesting: 'Vibrating now...',
    vibrationNotSupported: 'Haptic vibration is not supported on this browser',
    soundTestBtn: 'Test sound alarm',
    soundTab: 'Ringtone',
    vibrationTab: 'Vibration (Pocket)',
    alarmActiveNotice: 'Audio alarm and pocket vibration are actively firing',
    clickToUnlockAudio: 'Tap to unblock sound if restricted by browser',
    closestFirst: 'Nearest addresses first',
    nearestBadge: 'Nearest',
    showGpsOnMap: 'Show my GPS position on map',
    gpsCentered: 'Map centered on your GPS position',
    gpsNotDetectedPrompt: 'GPS position not yet detected',
    enableTestGpsLocation: 'Enable demo GPS position',
  },
  ar: {
    appName: 'أريفا - arreva',
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
    admobTitle: 'إعدادات الإعلانات / AdMob',
    admobSubtitle: 'معرفات تحقيق الدخل من Google AdMob / AdSense',
    advertisement: 'إعلان ممول',
    adMobBanner: 'بانر إعلاني AdMob',
    adClientId: 'معرف الناشر (مثال: ca-pub-XXXXXXXXXXXXXXXX)',
    adSlotId: 'معرف الوحدة الإعلانية (مثال: 1234567890)',
    saveAdConfig: 'حفظ الإعدادات',
    adConfigSaved: 'تم حفظ إعدادات AdMob',
    adMobTestNotice: 'بانر إعلاني للهاتف المحمول بنسق 320x50 مفعّل',
    closeAd: 'إغلاق',
    locPermissionRequiredTitle: 'تحديد الموقع GPS إلزامي',
    locPermissionRequiredDesc: 'يتطلب تطبيق أريفا الوصول إلى موقعك الحقيقي لحساب المسافة بدقة وإيقاظك قبل الوصول لمحطتك.',
    locPermissionDeniedTitle: 'تم رفض إذن تحديد الموقع GPS',
    locPermissionDeniedDesc: 'تم رفض إذن الوصول إلى الموقع. بدون تتبع GPS الفعلي، لا يمكن للمنبه معرفة وصولك بدقة.',
    locPermissionDeniedInstructions: "لتفعيل الموقع: اضغط على أيقونة القفل أو إعدادات الموقع بجانب شريط العنوان، ثم اختر 'الأذونات' وقم بتفعيل 'الموقع'.",
    locAuthorizeBtn: 'السماح بتحديد الموقع',
    locRetryBtn: 'إعادة المحاولة',
    locAcquiringPosition: 'جاري التقاط إشارة GPS بدقة عالية...',
    locChromeAndroidTip: 'في Chrome Android: اضغط على القفل بجانب الرابط > الأذونات > الموقع > سماح.',
    locSafariTip: 'في iPhone / Safari: افتح الإعدادات > Safari > الموقع > سماح.',
    locErrorTimeout: 'انتهت مهلة التقاط إشارة GPS. تأكد من أنك في مكان يتيح التقاط إشارة الأقمار الصناعية.',
    locErrorUnavailable: 'إشارة GPS غير متوفرة مؤقتًا على جهازك.',
    locActiveGpsBadge: 'نظام GPS عالي الدقة نشط',
    addFavorite: 'إضافة إلى المفضلة',
    addNewFavorite: 'إضافة وجهة مفضلة جديدة',
    favSearchAddress: 'ابحث عن عنوان أو محطة...',
    favAddedSuccess: 'تمت إضافة الوجهة إلى المفضلة بنجاح!',
    favAlreadyExists: 'هذه المحطة موجودة بالفعل في المفضلة.',
    chooseOnMapOrSearch: 'ابحث عن عنوان أو حدد من الخريطة',
    appOpenAdTitle: 'إعلان عند فتح التطبيق',
    appOpenAdDesc: 'جاري تحميل مساراتك ومنبه الوصول GPS...',
    skipAd: 'تخطي الإعلان',
    adMobAppOpenBadge: 'AdMob · إعلان عند الفتح',
    continueToApp: 'متابعة إلى أريفا',
    testAppOpenAd: 'تجربة إعلان الفتح',
    menu: 'القائمة',
    openMenu: 'فتح قائمة التنقل',
    closeMenu: 'إغلاق قائمة التنقل',
    navigation: 'التنقل والمسارات',
    aboutApp: 'حول التطبيق',
    gpsDiagnostic: 'تشخيص وحالة إشارة GPS',
    routeLineTrace: 'تخطيط المسار',
    showRouteLine: 'إظهار خط المسار',
    hideRouteLine: 'إخفاء خط المسار',
    routeActiveNotice: 'تتبع خط المسار نشط نحو الوجهة',
    roadRoute: 'مسار الطريق الفعلي',
    directRoute: 'خط مستقيم مباشر',
    busTraceHistory: 'سجل مسارات خطوط الحافلات',
    busLines: 'خطوط الحافلات',
    busLineNumber: 'رقم الخط',
    busLinePlaceholder: 'مثال: 38، 91، 72...',
    recordBusTrip: 'تسجيل مسار هذه الحافلة',
    saveTrace: 'حفظ المسار',
    traceSavedSuccess: 'تم حفظ مسار خط الحافلة بنجاح!',
    viewBusTraceOnMap: 'عرض على الخريطة',
    clearBusTraceFromMap: 'إخفاء المسار المعروض',
    activeBusTrace: 'مسار الحافلة المعروض',
    manualAddBusTrace: 'إضافة خط حافلة',
    exportGpx: 'تصدير GPX',
    exportGeoJson: 'تصدير GeoJSON',
    noBusTraces: 'لا يوجد مسارات حافلات مسجلة',
    noBusTracesDesc: 'سيتم حفظ رحلاتك وتتبعاتك لخطوط الحافلات تلقائيًا هنا.',
    traceDuration: 'المدة',
    traceDistance: 'المسافة',
    traceAvgSpeed: 'متوسط السرعة',
    startPoint: 'محطة الانطلاق',
    arrivalTerminus: 'محطة الوصول / النهاية',
    setAsDestination: 'تعيين كنقطة وصول',
    deleteTraceConfirm: 'هل تريد حذف هذا المسار نهائياً من السجل؟',
    resetSampleTraces: 'استعادة النماذج',
    close: 'إغلاق',
    delete: 'حذف',
    vibrationMode: 'نمط الاهتزاز',
    vibrationPatternsTitle: 'أنماط الاهتزاز (تنبيه الجيب)',
    vibrationPatternsSubtitle: 'مُصمم ومُعاير للإحساس بالمنبه بوضوح عندما يكون الهاتف في الجيب أو المعطف أو الحقيبة',
    pocketAlertNotice: 'نمط اهتزاز مخصص للهاتف داخل الجيب',
    testVibration: 'تجربة الاهتزاز',
    vibrationTesting: 'جارٍ الاهتزاز...',
    vibrationNotSupported: 'خاصية الاهتزاز اللمسي غير مدعومة في هذا المتصفح',
    soundTestBtn: 'تجربة المنبه الصوتي',
    soundTab: 'النغمة الصوتية',
    vibrationTab: 'الاهتزاز (الجيب)',
    alarmActiveNotice: 'المنبه الصوتي والاهتزاز قيد العمل الآن',
    clickToUnlockAudio: 'انقر لتفعيل الصوت في حال تم حظره من قبل المتصفح',
    closestFirst: 'الأقرب مسافة أولاً',
    nearestBadge: 'الأقرب إليك',
    showGpsOnMap: 'إظهار موقع GPS على الخريطة',
    gpsCentered: 'تم تمركز الخريطة على موقعك الحالي',
    gpsNotDetectedPrompt: 'لم يتم تحديد موقع GPS بعد',
    enableTestGpsLocation: 'تفعيل موقع تجريبي للاختبار',
  },
};
