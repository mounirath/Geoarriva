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
  TEST_MODE: true, // Activé par défaut pour garantir l'affichage des annonces en phase de test / dev
  INTERSTITIAL_COOLDOWN_MS: 30 * 1000, // 30s de cooldown en test pour faciliter les vérifications
};

type InterstitialTriggerListener = (placementId: string) => void;

class UnityAdsService {
  private gameId: string = UNITY_DEFAULTS.GAME_ID;
  private bannerPlacement: string = UNITY_DEFAULTS.BANNER_PLACEMENT;
  private interstitialPlacement: string = UNITY_DEFAULTS.INTERSTITIAL_PLACEMENT;
  private testMode: boolean = UNITY_DEFAULTS.TEST_MODE;
  private isInitialized: boolean = false;
  private isBannerLoading: boolean = false;
  private isInterstitialLoading: boolean = false;
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
          if (typeof parsed.testMode === 'boolean') {
            this.testMode = parsed.testMode;
          }
        }
      } catch (e) {
        // ignore
      }

      // Écouter les événements Cordova et Unity Ads
      if (typeof document !== 'undefined') {
        document.addEventListener('deviceready', () => {
          this.initCordova();
        });

        // Événement Cordova : initialisation terminée
        document.addEventListener('onInitializationComplete', () => {
          console.log('[UnityAds] onInitializationComplete reçu de Cordova.');
          this.isInitialized = true;
          // Précharger automatiquement la bannière
          this.showBanner('BOTTOM');
        });

        // Événement Cordova : bannière prête
        document.addEventListener('onBannerLoaded', () => {
          console.log('[UnityAds] onBannerLoaded reçu de Cordova, affichage de la bannière.');
          this.isBannerLoading = false;
          const plugin = this.getPlugin();
          if (plugin && typeof plugin.showBannerAd === 'function') {
            try {
              plugin.showBannerAd(
                () => console.log('[UnityAds] showBannerAd succès'),
                (err: any) => console.warn('[UnityAds] showBannerAd erreur:', err)
              );
            } catch (e) {
              console.warn('[UnityAds] Exception showBannerAd:', e);
            }
          }
        });

        document.addEventListener('onBannerFailedToLoad', (e: any) => {
          console.warn('[UnityAds] onBannerFailedToLoad reçu de Cordova:', e);
          this.isBannerLoading = false;
        });

        // Événement Cordova : interstitiel chargé et prêt
        document.addEventListener('onUnityAdsAdLoaded.Interstitial', () => {
          console.log('[UnityAds] onUnityAdsAdLoaded.Interstitial reçu de Cordova, affichage.');
          this.isInterstitialLoading = false;
          const plugin = this.getPlugin();
          if (plugin && typeof plugin.showInterstitialAd === 'function') {
            try {
              plugin.showInterstitialAd(
                () => console.log('[UnityAds] showInterstitialAd affiché'),
                (err: any) => {
                  console.warn('[UnityAds] showInterstitialAd erreur:', err);
                  this.notifyInterstitial(this.interstitialPlacement);
                }
              );
            } catch (e) {
              this.notifyInterstitial(this.interstitialPlacement);
            }
          }
        });

        document.addEventListener('onUnityAdsFailedToLoad.Interstitial', (e: any) => {
          console.warn('[UnityAds] onUnityAdsFailedToLoad.Interstitial reçu de Cordova:', e);
          this.isInterstitialLoading = false;
          // Si le SDK natif échoue à charger, on bascule sur l'aperçu in-app
          this.notifyInterstitial(this.interstitialPlacement);
        });
      }

      this.initialize();
    }
  }

  public isNativeAvailable(): boolean {
    return this.getPlugin() !== null;
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
    if (!plugin) {
      console.log('[UnityAdsService] Exécution dans le navigateur web (mode aperçu simulé).');
      return;
    }

    try {
      console.log(`[UnityAds] Initialisation du plugin Cordova natif avec Game ID: ${this.gameId}`);
      if (typeof plugin.unitySdkInitialize === 'function') {
        plugin.unitySdkInitialize(
          this.gameId,
          () => {
            console.log('[UnityAds] SDK Cordova natif initialisé.');
            this.isInitialized = true;
          },
          (err: any) => {
            console.warn('[UnityAds] Erreur init Cordova:', err);
          }
        );
      } else if (typeof plugin.initialize === 'function') {
        plugin.initialize(
          this.gameId,
          this.testMode,
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
   * Initialise le service Unity Ads
   */
  public initialize(gameId?: string, testMode: boolean = UNITY_DEFAULTS.TEST_MODE) {
    if (gameId) {
      this.gameId = gameId;
    }
    this.testMode = testMode;
    this.isInitialized = true;
    console.log(`[UnityAdsService] Prêt avec Game ID: ${this.gameId} (Mode test: ${this.testMode})`);
  }

  /**
   * Met à jour les identifiants de placement et persiste la configuration
   */
  public updateConfig(
    gameId: string,
    bannerPlacement: string,
    interstitialPlacement: string,
    testMode: boolean = true
  ) {
    this.gameId = gameId.trim() || UNITY_DEFAULTS.GAME_ID;
    this.bannerPlacement = bannerPlacement.trim() || UNITY_DEFAULTS.BANNER_PLACEMENT;
    this.interstitialPlacement = interstitialPlacement.trim() || UNITY_DEFAULTS.INTERSTITIAL_PLACEMENT;
    this.testMode = testMode;

    try {
      localStorage.setItem(
        'unity_ads_config',
        JSON.stringify({
          gameId: this.gameId,
          banner: this.bannerPlacement,
          interstitial: this.interstitialPlacement,
          testMode: this.testMode,
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

  public isTestMode(): boolean {
    return this.testMode;
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
      // Sous Cordova avec SDK natif
      if (typeof plugin.loadInterstitialAd === 'function') {
        try {
          this.isInterstitialLoading = true;
          plugin.loadInterstitialAd(
            this.interstitialPlacement,
            () => {
              console.log('[UnityAds] Chargement interstitiel déclenché');
            },
            (err: any) => {
              console.warn('[UnityAds] Erreur chargement interstitiel natif, bascule UI:', err);
              this.isInterstitialLoading = false;
              this.notifyInterstitial(this.interstitialPlacement);
            }
          );
          return;
        } catch (e) {
          console.warn('[UnityAds] Exception native show:', e);
        }
      }
    }

    // Dans le navigateur Web ou en fallback UI
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
      if (typeof plugin.loadBannerAd === 'function') {
        const pos = position === 'TOP' ? 'top-center' : 'bottom-center';
        this.isBannerLoading = true;
        console.log(`[UnityAds] Demande de chargement de la bannière : ${this.bannerPlacement} (${pos})`);
        plugin.loadBannerAd(
          this.bannerPlacement,
          pos,
          () => {
            console.log('[UnityAds] loadBannerAd envoyé au SDK natif');
          },
          (e: any) => {
            console.warn('[UnityAds] Erreur loadBannerAd:', e);
            this.isBannerLoading = false;
          }
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
