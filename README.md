# PhoneMirror — site de téléchargement

Site statique en français pour télécharger les deux APK signés PhoneMirror 0.3.1. Responsive, accessible au clavier, sans dépendance externe ni étape de compilation des APK.

## Vercel

Importer ce dépôt dans Vercel et conserver **Root Directory : racine du dépôt**. `vercel.json` définit automatiquement :

- Framework : **Other** (`null`).
- Commande de build : `node scripts/verify.mjs`.
- Installation : aucune (`installCommand: ""`).
- Dossier publié : `public`.

Le contrôle de build vérifie les deux empreintes SHA-256, les fichiers APK et les liens locaux. Les téléchargements sont servis comme `application/vnd.android.package-archive` avec `Content-Disposition: attachment`. Aucune réécriture ne peut transformer un téléchargement APK en page HTML. Aucun secret ni variable d'environnement n'est requis.

```sh
npm test
npm run build
```

Pour une prévisualisation locale : `python -m http.server 4173 --directory public`.

## Fichiers distribués

- `public/downloads/PhoneMirror-Android-0.3.1.apk` : `local.phonemirror.android`, Android 8 minimum ; audio interne à partir d'Android 10.
- `public/downloads/PhoneMirror-TV-0.3.1.apk` : `local.phonemirror.tv`, Android TV / Google TV, Android 8 minimum.
- `public/downloads/SHA256.json` : intégrité des deux APK.
- `public/downloads/CORRECTIF-ROTATION-0.3.1.md` : bilan des tests et limites connues.

Les signatures APK v2/v3 ont été vérifiées avant ajout au dépôt. Les deux APK signés ont été installés et lancés dans un émulateur Android 15. Cela ne garantit pas leur compatibilité avec tous les modèles ou toutes les versions Android. Une ancienne application signée avec une autre clé doit être désinstallée avant cette installation ; sauvegarder ses éventuelles données utiles auparavant.

Samsung Tizen et LG webOS ne peuvent pas installer un APK Android : utiliser un Chromecast, une connexion DLNA compatible ou un boîtier Android TV / Google TV. L'application reste une bêta : la stabilité 1080p/60 prolongée, la chauffe, la latence et le Wi-Fi physique ne sont pas certifiés.

## Publier une nouvelle version

Ajouter des APK avec de nouveaux noms de version, actualiser les empreintes SHA-256 et les liens de la page, puis exécuter `npm test`. Les APK portant une version utilisent un cache immutable ; ne pas remplacer un binaire déjà publié sous le même nom.

Les clés de signature, mots de passe et identifiants Vercel ne sont pas distribués dans ce dépôt.

## Préversion AirPlay 0.4.1

`public/downloads/PhoneMirror-TV-AirPlay-0.4.1.apk` est une application TV distincte (`local.phonemirror.tv.airplay`) qui reçoit la recopie d'écran native de l'iPhone. Elle peut coexister avec les APK Android 0.3.1. Le site conserve ces deux téléchargements et ajoute un troisième téléchargement réservé à AirPlay.

Cette préversion est compilée et signée, mais n'est pas validée sur un iPhone et une télévision physiques. Les 49 tests unitaires et le test des deux origines de latence passent ; les derniers passages du probe en émulateur ont saturé la file et sont non concluants pour la performance. Consulter `AIRPLAY-0.4.1.md` et `AUDIT-FLUIDITE-AIRPLAY-0.4.1.md` pour les limites et l'état exact des vérifications. Les sources adaptées sous GPL-3.0 et les notices sont fournies dans `PhoneMirror-TV-AirPlay-0.4.1-sources.zip` ; aucune clé de signature n'y est incluse. `RELEASES.json` distingue les versions et canaux des trois APK, et `SHA256.json` fournit leurs empreintes.
