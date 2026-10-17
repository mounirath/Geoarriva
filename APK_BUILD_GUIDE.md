# Guide : Créer et Télécharger l'APK Android avec GitHub Actions

Ce guide vous explique étape par étape comment lancer la compilation automatique de votre application Android (`.apk`) directement sur GitHub sans avoir besoin d'installer Android Studio sur votre ordinateur.

---

## 1. Comment déclencher la création de l'APK

1. Ouvrez votre dépôt sur **GitHub**.
2. Cliquez sur l'onglet **Actions** (en haut de la page).
3. Dans la liste des workflows à gauche, sélectionnez **Build Android APK (Cordova)**.
4. Cliquez sur le bouton **Run workflow** (à droite).
5. Choisissez la branche (`main` ou `master`), sélectionnez le type de compilation (`debug` ou `release`), puis validez avec **Run workflow**.

> 💡 **Déclenchement automatique** : À chaque `git push` sur votre branche principale, le workflow se lance également tout seul pour générer le dernier APK à jour.

---

## 2. Comment récupérer et télécharger l'APK généré

1. Une fois le workflow terminé (icône verte ✔️ « Build Android APK ») :
2. Cliquez sur l'exécution correspondante dans la liste.
3. En bas de la page récapitulative, dans la section **Artifacts**, vous trouverez :
   - 📦 **`arreva-android-apk`**
4. Cliquez dessus pour télécharger le fichier ZIP contenant le fichier `arreva-debug.apk`.
5. Décompressez le ZIP et transférez le fichier `.apk` sur votre smartphone Android.

---

## 3. Installation sur votre smartphone Android

1. Sur votre smartphone Android, ouvrez le fichier `arreva-debug.apk`.
2. Si Android vous demande d'autoriser l'installation d'applications provenant de sources inconnues / de ce navigateur :
   - Cliquez sur **Paramètres**.
   - Activez **Autoriser cette source**.
3. Cliquez sur **Installer**.
4. Au premier démarrage, autorisez l'accès à la **Localisation (Position GPS)** lorsque l'application vous le demande pour activer le suivi d'arrivée et l'alarme en poche.
