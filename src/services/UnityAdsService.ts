/**
 * UnityAdsService - Service officiel de gestion de Unity Ads pour l'application Arreva
 * 
 * Identifiants configurés par l'utilisateur :
 * - Game ID : 800387003
 * - Organization Core ID : 11270132357134
 * - Placement Bannière : BP_Banner_Android
 * - Placement Interstitiel : BP_Interstitial_Android
 */

export const UNITY_DEFAULTS = {
  GAME_ID: '800387003',
  ORGANIZATION_CORE_ID: '11270132357134',
  BANNER_PLACEMENT: 'BP_Banner_Android',
  INTERSTITIAL_PLACEMENT: 'BP_Interstitial_Android',
  TEST_MODE: false,
  INTERSTITIAL_COOLDOWN_MS: 2 * 60 * 1000, // 2 minutes
};

type InterstitialTriggerListener = (placementId: string) => void;

class UnityAdsService {
  private gameId: string = UNITY_DEFAULTS.GAME_ID;
  private bannerPlacement: string = UNITY_DEFAULTS.BANNER_PLACEMENT;
  private interstitialPlacement: string = UNITY_DEFAULTS.INTERSTITIAL_PLACEMENT;
  private isInitialized: boolean = false;
  private lastInterstitialTime: number = 0;
  private interstitialListeners: Set<InterstitialTriggerListener> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('unity_ads_config');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.gameId = parsed.gameId || UNITY_DEFAULTS.GAME_ID;
          this.bannerPlacement = parsed.banner || UNITY_DEFAULTS.BANNER_PLACEMENT;
          this.interstitialPlacement = parsed.interstitial || UNITY_DEFAULTS.INTERSTITIAL_PLACEMENT;
        }
      } catch (e) {
        // ignore
      }

      // Écouter deviceready pour Cordova
      if (typeof document !== 'undefined') {
        document.addEventListener('deviceready', () => {
          this.initCordova();
        });
      }

      this.initialize();
    }
  }

  private getPlugin(): any {
    if (typeof window === 'undefined') return null;
    const win = window as any;
    return (
      win.cordova?.plugins?.emiUnityAdsPlugin ||
      win.cordova?.plugins?.UnityAds ||
      win.UnityAds ||
      null
    );
  }

  /**
   * Initialisation du SDK natif sous Cordova si disponible
   */
  private initCordova() {
    const plugin = this.getPlugin();
    if (!plugin) return;

    try {
      if (typeof plugin.unitySdkInitialize === 'function') {
        plugin.unitySdkInitialize(
          this.gameId,
          () => {
            console.log('[UnityAds] SDK Cordova natif initialisé avec succès.');
            this.isInitialized = true;
          },
          (err: any) => {
            console.warn('[UnityAds] Erreur init Cordova:', err);
          }
        );
      } else if (typeof plugin.initialize === 'function') {
        plugin.initialize(
          this.gameId,
          UNITY_DEFAULTS.TEST_MODE,
          () => {
            console.log('[UnityAds] SDK Cordova natif initialisé.');
            this.isInitialized = true;
          },
          (err: any) => {
            console.warn('[UnityAds] Erreur init Cordova:', err);
          }
        );
      }
    } catch (e) {
      console.warn('[UnityAds] Exception init Cordova:', e);
    }
  }

  /**
   * Initialise le SDK Unity Ads
   */
  public initialize(gameId?: string, testMode: boolean = UNITY_DEFAULTS.TEST_MODE) {
    if (gameId) {
      this.gameId = gameId;
    }

    this.isInitialized = true;
    console.log(`[UnityAdsService] Prêt avec Game ID: ${this.gameId} (Mode test: ${testMode})`);
  }

  /**
   * Met à jour les identifiants de placement et persiste la configuration
   */
  public updateConfig(gameId: string, bannerPlacement: string, interstitialPlacement: string) {
    this.gameId = gameId.trim() || UNITY_DEFAULTS.GAME_ID;
    this.bannerPlacement = bannerPlacement.trim() || UNITY_DEFAULTS.BANNER_PLACEMENT;
    this.interstitialPlacement = interstitialPlacement.trim() || UNITY_DEFAULTS.INTERSTITIAL_PLACEMENT;

    try {
      localStorage.setItem(
        'unity_ads_config',
        JSON.stringify({
          gameId: this.gameId,
          banner: this.bannerPlacement,
          interstitial: this.interstitialPlacement,
        })
      );
    } catch (e) {
      // ignore
    }

    this.initCordova();
  }

  public getGameId(): string {
    return this.gameId;
  }

  public getBannerPlacement(): string {
    return this.bannerPlacement;
  }

  public getInterstitialPlacement(): string {
    return this.interstitialPlacement;
  }

  /**
   * S'abonne aux demandes d'affichage d'interstitiel pour le lecteur d'annonce dans l'UI
   */
  public onTriggerInterstitial(listener: InterstitialTriggerListener): () => void {
    this.interstitialListeners.add(listener);
    return () => {
      this.interstitialListeners.delete(listener);
    };
  }

  /**
   * Vérifie si le cooldown d'affichage d'interstitiel est écoulé
   */
  public canShowInterstitial(): boolean {
    const now = Date.now();
    return now - this.lastInterstitialTime > UNITY_DEFAULTS.INTERSTITIAL_COOLDOWN_MS;
  }

  /**
   * Charge et affiche une publicité interstitielle Unity
   */
  public showInterstitial(force: boolean = false, onAdClosed?: () => void) {
    if (!force && !this.canShowInterstitial()) {
      if (onAdClosed) onAdClosed();
      return;
    }

    this.lastInterstitialTime = Date.now();
    console.log(`[UnityAdsService] Affichage de l'interstitiel pour : ${this.interstitialPlacement}`);

    const plugin = this.getPlugin();
    if (plugin) {
      if (typeof plugin.loadInterstitialAd === 'function' && typeof plugin.showInterstitialAd === 'function') {
        try {
          plugin.loadInterstitialAd(
            this.interstitialPlacement,
            () => {
              plugin.showInterstitialAd(
                () => { if (onAdClosed) onAdClosed(); },
                () => { this.notifyInterstitial(this.interstitialPlacement); if (onAdClosed) onAdClosed(); }
              );
            },
            () => {
              this.notifyInterstitial(this.interstitialPlacement);
              if (onAdClosed) onAdClosed();
            }
          );
          return;
        } catch (e) {
          console.warn('[UnityAds] Exception native show:', e);
        }
      } else if (typeof plugin.show === 'function') {
        try {
          plugin.show(
            this.interstitialPlacement,
            () => { if (onAdClosed) onAdClosed(); },
            () => { this.notifyInterstitial(this.interstitialPlacement); if (onAdClosed) onAdClosed(); }
          );
          return;
        } catch (e) {
          console.warn('[UnityAds] Exception show:', e);
        }
      }
    }

    // Fallback sur le lecteur in-app
    this.notifyInterstitial(this.interstitialPlacement);
    if (onAdClosed) {
      setTimeout(onAdClosed, 5500);
    }
  }

  private notifyInterstitial(placementId: string) {
    this.interstitialListeners.forEach((listener) => {
      try {
        listener(placementId);
      } catch (err) {
        console.error('Erreur listener interstitiel Unity:', err);
      }
    });
  }

  /**
   * Affiche la bannière Unity Ads
   */
  public showBanner(position: 'TOP' | 'BOTTOM' = 'BOTTOM') {
    const plugin = this.getPlugin();
    if (!plugin) return;

    try {
      if (typeof plugin.loadBannerAd === 'function' && typeof plugin.showBannerAd === 'function') {
        const pos = position === 'TOP' ? 'top-center' : 'bottom-center';
        plugin.loadBannerAd(
          this.bannerPlacement,
          pos,
          () => {
            plugin.showBannerAd(
              () => console.log('[UnityAds] Bannière affichée avec succès'),
              (e: any) => console.warn('[UnityAds] Erreur showBanner:', e)
            );
          },
          (e: any) => console.warn('[UnityAds] Erreur loadBannerAd:', e)
        );
      } else if (typeof plugin.showBanner === 'function') {
        plugin.showBanner(this.bannerPlacement, position);
      }
    } catch (e) {
      console.warn('Erreur showBanner Cordova:', e);
    }
  }

  /**
   * Masque la bannière publicitaire
   */
  public hideBanner() {
    const plugin = this.getPlugin();
    if (!plugin) return;

    try {
      if (typeof plugin.hideBannerAd === 'function') {
        plugin.hideBannerAd();
      } else if (typeof plugin.hideBanner === 'function') {
        plugin.hideBanner();
      }
    } catch (e) {
      console.warn('Erreur hideBanner Cordova:', e);
    }
  }
}

export const unityAdsService = new UnityAdsService();
