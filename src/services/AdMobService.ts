/**
 * AdMobService - Gestion centralisée Google AdMob (Bannière & Interstitiel)
 * 
 * Identifiants configurés par l'utilisateur :
 * - ID d'application AdMob : ca-app-pub-1050422776945344~6855047295
 * - Bloc d'annonce Interstitiel : ca-app-pub-1050422776945344/6108238532
 * - Bloc d'annonce Bannière : ca-app-pub-1050422776945344/3286634079
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
  INTERSTITIAL_AD_UNIT_ID: 'ca-app-pub-1050422776945344/6108238532',
  BANNER_AD_UNIT_ID: 'ca-app-pub-1050422776945344/3286634079',
  PUBLISHER_ID: 'ca-app-pub-1050422776945344',
  INTERSTITIAL_SLOT_ID: '6108238532',
  BANNER_SLOT_ID: '3286634079',
  RESUME_COOLDOWN_MS: 3 * 60 * 1000, // 3 minutes entre annonces au retour
};

type InterstitialListener = () => void;

class AdMobManager {
  private appId: string = ADMOB_DEFAULTS.APP_ID;
  private interstitialId: string = ADMOB_DEFAULTS.INTERSTITIAL_AD_UNIT_ID;
  private bannerId: string = ADMOB_DEFAULTS.BANNER_AD_UNIT_ID;
  private lastInterstitialTime: number = 0;
  private interstitialListeners: Set<InterstitialListener> = new Set();
  private isBannerVisible: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('admob_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.appId = parsed.appId || ADMOB_DEFAULTS.APP_ID;
          this.interstitialId = parsed.interstitialId || ADMOB_DEFAULTS.INTERSTITIAL_AD_UNIT_ID;
          this.bannerId = parsed.bannerId || ADMOB_DEFAULTS.BANNER_AD_UNIT_ID;
        }
      } catch {
        // ignore
      }

      this.init();
    }
  }

  private init() {
    if (typeof document !== 'undefined') {
      document.addEventListener('deviceready', () => {
        this.initCordovaAdMob();
      });
    }
  }

  /**
   * Initialise le plugin Cordova AdMob natif dans l'APK Android
   */
  public initCordovaAdMob() {
    const admobPlugin = window.admob || window.AdMob;
    if (admobPlugin) {
      try {
        // Configuration bannière
        if (admobPlugin.banner) {
          admobPlugin.banner.config({
            id: this.bannerId,
            isTesting: false,
            autoShow: true,
          });
          admobPlugin.banner.prepare();
        }

        // Configuration interstitiel
        if (admobPlugin.interstitial) {
          admobPlugin.interstitial.config({
            id: this.interstitialId,
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
   * Affichage de l'interstitiel Cordova natif ou simulation Web
   */
  public showInterstitial(force: boolean = false): boolean {
    const now = Date.now();
    if (!force && now - this.lastInterstitialTime < ADMOB_DEFAULTS.RESUME_COOLDOWN_MS) {
      return false;
    }

    this.lastInterstitialTime = now;

    // 1. Tenter le plugin Cordova natif
    const admobPlugin = window.admob || window.AdMob;
    if (admobPlugin && admobPlugin.interstitial) {
      try {
        admobPlugin.interstitial.show();
        admobPlugin.interstitial.prepare();
        return true;
      } catch (e) {
        console.warn('Erreur affichage interstitiel natif AdMob:', e);
      }
    }

    // 2. Déclencher le modal interstitiel Web
    this.notifyInterstitial();
    return true;
  }

  public onTriggerInterstitial(listener: InterstitialListener): () => void {
    this.interstitialListeners.add(listener);
    return () => this.interstitialListeners.delete(listener);
  }

  private notifyInterstitial() {
    this.interstitialListeners.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        console.error('Erreur listener interstitiel AdMob:', e);
      }
    });
  }

  public getAppId(): string {
    return this.appId;
  }

  public getInterstitialId(): string {
    return this.interstitialId;
  }

  public getBannerId(): string {
    return this.bannerId;
  }

  public updateConfig(appId: string, interstitialId: string, bannerId: string) {
    this.appId = appId.trim() || ADMOB_DEFAULTS.APP_ID;
    this.interstitialId = interstitialId.trim() || ADMOB_DEFAULTS.INTERSTITIAL_AD_UNIT_ID;
    this.bannerId = bannerId.trim() || ADMOB_DEFAULTS.BANNER_AD_UNIT_ID;

    try {
      localStorage.setItem(
        'admob_config',
        JSON.stringify({
          appId: this.appId,
          interstitialId: this.interstitialId,
          bannerId: this.bannerId,
        })
      );
    } catch {
      // ignore
    }

    this.initCordovaAdMob();
  }

  public getIsBannerVisible(): boolean {
    return this.isBannerVisible;
  }

  public setIsBannerVisible(visible: boolean) {
    this.isBannerVisible = visible;
  }
}

export const adMobService = new AdMobManager();
