/**
 * AdMobService - Gestion centralisée Google AdMob & Annonce à l'ouverture (App Open Ad)
 * 
 * Identifiants configurés par l'utilisateur :
 * - ID d'application AdMob : ca-app-pub-1050422776945344~6855047295
 * - Bloc d'annonce à l'ouverture : ca-app-pub-1050422776945344/8752251197
 */

declare global {
  interface Window {
    cordova?: any;
    admob?: any;
    AdMob?: any;
  }
}

export const ADMOB_DEFAULTS = {
  APP_ID: 'ca-app-pub-1050422776945344~6855047295',
  APP_OPEN_AD_UNIT_ID: 'ca-app-pub-1050422776945344/8752251197',
  PUBLISHER_ID: 'ca-app-pub-1050422776945344',
  BANNER_SLOT_ID: '8752251197',
  // Délai minimum entre deux annonces à l'ouverture lors du retour en premier plan (3 minutes)
  RESUME_COOLDOWN_MS: 3 * 60 * 1000,
};

class AdMobManager {
  private lastAppOpenAdTime: number = 0;
  private isCordovaReady: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Écoute Cordova deviceready
    document.addEventListener('deviceready', () => {
      this.isCordovaReady = true;
      this.initCordovaAdMob();
    });
  }

  /**
   * Initialise le plugin Cordova AdMob natif si présent
   */
  public initCordovaAdMob() {
    const admobPlugin = window.admob || window.AdMob;
    if (admobPlugin) {
      try {
        if (admobPlugin.interstitial) {
          admobPlugin.interstitial.config({
            id: ADMOB_DEFAULTS.APP_OPEN_AD_UNIT_ID,
            isTesting: false,
            autoShow: false,
          });
          admobPlugin.interstitial.prepare();
        }
      } catch (err) {
        console.warn('Erreur init Cordova AdMob:', err);
      }
    }
  }

  /**
   * Tente d'afficher l'annonce native Cordova si disponible
   */
  public showCordovaAppOpen(): boolean {
    const admobPlugin = window.admob || window.AdMob;
    if (admobPlugin && admobPlugin.interstitial) {
      try {
        admobPlugin.interstitial.show();
        // Prépare la suivante
        admobPlugin.interstitial.prepare();
        return true;
      } catch (e) {
        console.warn('showCordovaAppOpen error:', e);
      }
    }
    return false;
  }

  /**
   * Vérifie si le délai de cooldown pour l'annonce à l'ouverture est écoulé
   */
  public canShowAppOpenAd(): boolean {
    const now = Date.now();
    return now - this.lastAppOpenAdTime > ADMOB_DEFAULTS.RESUME_COOLDOWN_MS;
  }

  public recordAppOpenAdShown() {
    this.lastAppOpenAdTime = Date.now();
  }
}

export const adMobService = new AdMobManager();
