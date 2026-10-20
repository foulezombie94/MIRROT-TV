# PhoneMirror — site de téléchargement

Site statique en français pour télécharger les deux APK signés PhoneMirror 0.2.0. Responsive, accessible au clavier, sans dépendance externe ni étape de compilation des APK.

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

- `public/downloads/PhoneMirror-Android-0.2.0.apk` : `local.phonemirror.android`, Android 8 minimum ; audio interne à partir d'Android 10.
- `public/downloads/PhoneMirror-TV-0.2.0.apk` : `local.phonemirror.tv`, Android TV / Google TV, Android 8 minimum.
- `public/downloads/SHA256.json` : intégrité des deux APK.
- `public/downloads/AUDIT-0.2.0.md` : bilan des tests et limites connues.

Les signatures APK v2/v3 ont été vérifiées avant ajout au dépôt. Les deux APK signés ont été installés et lancés dans un émulateur Android 15. Cela ne garantit pas leur compatibilité avec tous les modèles ou toutes les versions Android. Une ancienne application signée avec une autre clé doit être désinstallée avant cette installation ; sauvegarder ses éventuelles données utiles auparavant.

Samsung Tizen et LG webOS ne peuvent pas installer un APK Android : utiliser un Chromecast, une connexion DLNA compatible ou un boîtier Android TV / Google TV. L'application reste une bêta : la stabilité 1080p/60 prolongée, la chauffe, la latence et le Wi-Fi physique ne sont pas certifiés.

## Publier une nouvelle version

Ajouter des APK avec de nouveaux noms de version, actualiser les empreintes SHA-256 et les liens de la page, puis exécuter `npm test`. Les APK portant une version utilisent un cache immutable ; ne pas remplacer un binaire déjà publié sous le même nom.

Les clés de signature, mots de passe, sources Android, fichiers QA et identifiants Vercel ne sont pas distribués dans ce dépôt.
