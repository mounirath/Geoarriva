// Service pour gérer Unity Ads avec le SDK officiel Unity
// Assurez-vous d'avoir installé le package Unity Ads (ex: react-native-unity-ads ou via Cordova/Capacitor selon votre stack)

export const UNITY_DEFAULTS = {
  GAME_ID: '800387003',
  BANNER_PLACEMENT: 'BP_Banner_Android',
  INTERSTITIAL_PLACEMENT: 'BP_Interstitial_Android',
};

class UnityAdsService {
  private gameId: string = UNITY_DEFAULTS.GAME_ID;
  private bannerPlacement: string = UNITY_DEFAULTS.BANNER_PLACEMENT;
  private interstitialPlacement: string = UNITY_DEFAULTS.INTERSTITIAL_PLACEMENT;
  private isInitialized: boolean = false;

  /**
   * Initialise le SDK Unity Ads
   */
  public initialize(gameId?: string, testMode: boolean = true) {
    if (this.isInitialized) return;

    if (gameId) {
      this.gameId = gameId;
    }

    // TODO: Remplacez par l'appel réel d'initialisation de votre plugin Unity Ads natif
    // Exemple avec un plugin Capacitor/Cordova ou React Native :
    // UnityAds.initialize(this.gameId, testMode, (success) => {
    //   this.isInitialized = success;
    //   console.log("Unity Ads Initialized:", success);
    // }, (error) => {
    //   console.error("Unity Ads Init Error:", error);
    // });

    console.log(`[UnityAdsService] Initialisation avec Game ID: ${this.gameId} (Mode test: ${testMode})`);
    this.isInitialized = true;
  }

  /**
   * Met à jour les identifiants de placement
   */
  public updateConfig(gameId: string, bannerPlacement: string, interstitialPlacement: string) {
    this.gameId = gameId;
    this.bannerPlacement = bannerPlacement;
    this.interstitialPlacement = interstitialPlacement;
    
    // Ré-initialiser avec le nouveau Game ID si nécessaire
    this.initialize(gameId);
  }

  /**
   * Charge et affiche une publicité interstitielle
   */
  public showInterstitial(onAdClosed?: () => void) {
    console.log(`[UnityAdsService] Chargement de l'interstitiel pour le placement : ${this.interstitialPlacement}`);

    // Simulation pour le développement web / PWA (si le SDK natif n'est pas présent)
    if (typeof window !== 'undefined' && !window.hasOwnProperty('UnityAds')) {
      alert(`[Simulation Unity Ads] Publicité interstitielle (${this.interstitialPlacement}) affichée avec succès !`);
      if (onAdClosed) onAdClosed();
      return;
    }

    // TODO: Appel natif réel de l'interstitiel
    // UnityAds.load(this.interstitialPlacement, {
    //   onUnityAdsAdLoaded: (placementId) => {
    //     UnityAds.show(placementId, {}, (showResult) => {
    //       if (onAdClosed) onAdClosed();
    //     });
    //   },
    //   onUnityAdsFailedToLoad: (placementId, error, message) => {
    //     console.error("Erreur chargement interstitiel Unity:", message);
    //     if (onAdClosed) onAdClosed();
    //   }
    // });
  }

  /**
   * Affiche une bannière publicitaire
   */
  public showBanner(position: 'TOP' | 'BOTTOM' = 'BOTTOM') {
    console.log(`[UnityAdsService] Affichage de la bannière : ${this.bannerPlacement} en position ${position}`);
    
    // TODO: Intégration du composant ou de la méthode native de bannière Unity Ads
  }

  /**
   * Masque la bannière publicitaire
   */
  public hideBanner() {
    console.log(`[UnityAdsService] Masquage de la bannière`);
    
    // TODO: Masquage de la bannière native
  }
}

export const unityAdsService = new UnityAdsService();
