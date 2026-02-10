Hoopsphere - correction barre de navigation Android (bande blanche)
==================================================================

Probleme
--------
Sur certains Android (navigation 3 boutons), une bande blanche apparait en bas et le footer semble coupe en deux couleurs.

Objectif
--------
Avoir une couleur uniforme en bas de l'ecran (la meme que l'app : #0E0D0D).

Important
---------
Si le dossier `android/` n'est pas versionne dans le repo, les modifications natives
ne seront PAS presentes chez la personne qui build pour le Play Store.


Option A (natif) - Le plus fiable
---------------------------------
A utiliser si `android/` est dans le repo et pushable.

1) android/app/src/main/res/values/styles.xml
   Verifier / ajouter :
   - android:statusBarColor = #0E0D0D
   - android:navigationBarColor = #0E0D0D
   - android:enforceNavigationBarContrast = false
   - android:windowLightNavigationBar = false

2) android/app/src/main/java/com/hoopsphere/app/MainActivity.kt
   Dans onCreate, apres setTheme(...) et super.onCreate(...), appliquer :
   - window.statusBarColor = #0E0D0D
   - window.navigationBarColor = #0E0D0D
   - forcer les icones claires (desactiver les flags "light")

3) app.json (optionnel)
   - androidStatusBar.backgroundColor = #0E0D0D
   - androidNavigationBar.backgroundColor = #0E0D0D
   - androidNavigationBar.barStyle = light-content

4) Rebuild Android (release ou debug).


Option B (JS/runtime) - Sans dossier android
--------------------------------------------
A utiliser si `android/` n'est pas versionne.

1) Installer :
   - expo-navigation-bar

2) Dans App.tsx :
   - import * as NavigationBar from "expo-navigation-bar";
   - sur Android, appeler :
     NavigationBar.setBackgroundColorAsync("#0E0D0D")
     NavigationBar.setButtonStyleAsync("light")
     NavigationBar.setVisibilityAsync("visible")

3) Rebuild Android (release ou debug).


Notes
-----
Certains constructeurs (Huawei, etc.) imposent une barre claire en navigation 3 boutons.
Si le blanc persiste meme apres les changements :
 - essayer app.json -> android.edgeToEdgeEnabled = false
 - ou passer le telephone en navigation par gestes (plus de barre 3 boutons)


Verification avant Play Store
-----------------------------
Build une release localement ou via EAS, installe sur un vrai telephone.
Si c'est ok en release, ce sera identique sur le Play Store.
