# Bilan PhoneMirror Android / TV 0.2.0

Date : 20 octobre 2026. **Bêta testable, pas une certification de stabilité en production.** Aucun téléphone ou téléviseur physique n'était connecté. Les résultats ci-dessous ne garantissent ni toutes les TV, ni 1080p/60 pendant plusieurs heures sur du matériel réel.

## Corrections réalisées

- API compatible Android 8 : absence de `ByteArrayOutputStream.writeBytes()`.
- Format NAL explicite ; validation H.264, SPS/PPS et image clé avant publication ; segments incomplets abandonnés et reprise sur IDR avec discontinuité.
- Un seul délimiteur AUD par image. La comparaison sur le lecteur natif a révélé qu'en ajouter un devant une image qui en contenait déjà un pouvait figer la lecture ; ce défaut est corrigé et couvert par un test.
- Durée cible HLS constante, fenêtre annoncée de six secondes, conservation temporisée et mémoire bornée.
- Compteurs et watchdog actualisés uniquement pour les images acceptées.
- Finalisation AAC/HLS avant fermeture HTTP ; dernier segment et ENDLIST accessibles pendant le délai de fin de lecture.
- AAC interne, horloge monotone, démarrage commun mesuré, resampling adaptatif et réglage d'un décalage constant. Reprise bornée sur rupture d'horloge audio.
- Contrôle TV et réseau hors du thread d'encodage ; temporisations, files et clients bornés ; état TV fondé aussi sur la fraîcheur des images.
- Reprise Wi-Fi sur adresse inchangée, sélection explicite du réseau Wi-Fi même sans accès Internet, arrêt explicite écran éteint, surveillance thermique Android.

## Résultats observés

| Contrôle | Résultat et limite |
|---|---|
| Compilation des deux APK release et lint | Réussite ; aucune erreur lint. Avertissements résiduels de traduction, configuration de sauvegarde, orientation TV et annotations/outils. |
| Tests unitaires | 30 réussis, zéro échec : 17 transport/HTTP/arrêt + 13 audio/horloge/synchronisation/AUD/reprise. |
| Transport H.264 + AAC, deux heures simulées | 432 000 images vidéo ; mémoire retenue finale 26 351 584 octets, 19 segments. Ce test accéléré répète une source de dix secondes ; ce n'est pas deux heures de capture physique. |
| Décodage de la fin du test de deux heures | 360 images finales identiques pixel par pixel à la source ; aucune erreur de décodage FFmpeg sur cette fenêtre. |
| Dérive d'horloge audio | Tests sur deux heures simulées avec écarts de −200 et +200 ppm : erreur d'horloge inférieure à 1 ms. Cela ne mesure pas le décalage acoustique réel de la TV. |
| Capture Android avec audio | Capture réellement produite par MediaProjection + AudioRecord/AAC dans Android 15 émulé ; son non silencieux et vidéo décodable. Variante QA en encodage logiciel 960 × 540, cible 30 i/s ; ce n'est pas une preuve de capture matérielle 1080p/60. |
| Mesure des impulsions A/V capturées | Écart observé de −40 à +59 ms sur neuf impulsions dans un essai du pipeline, sans correction manuelle. Essai court en émulateur, avant les derniers changements de reprise et normalisation AUD ; à refaire sur les APK livrés et les appareils physiques. |
| Récepteur natif, flux corrigé après deux heures simulées | Lecture réelle Media3 : 133 images observées, PTS vidéo 2,20 s, état playing, dernière image âgée de 2 ms à la dernière mesure. Essai de quelques secondes seulement. |
| Retards réseau et erreurs HTTP | Avec 150 ms de délai artificiel et une réponse 503 au premier accès des segments : 140 images observées, PTS 2,316655 s, lecture active. Ce test ne mesure pas les pertes de paquets radio. |
| Appairage TV | Code absent/incorrect refusé (403), code correct accepté (200), source externe refusée (400). |
| Coupure Wi-Fi du téléphone émulé | Coupure de trois secondes détectée ; réseau retrouvé dans la fenêtre de reprise ; compteurs vidéo/audio continuent. Contrôleur QA simulé, pas une TV physique en train de lire le téléphone pendant cette coupure. |
| Rotation et changement de résolution Android | Après correctifs, capture et compteurs audio/vidéo continuent ; sortie conservée à 960 × 540 pendant le test 1440 × 2560 du display source. |
| Écran éteint | Service arrêté proprement dans le test final ; une nouvelle autorisation est nécessaire pour reprendre. |
| Signatures | Deux APK signés, signatures v2/v3 vérifiées ; version 0.2.0, minSdk 26, targetSdk 35. Aucun lanceur QA dans les APK livrés. |

## Ce qui reste à valider physiquement

1. Capture et affichage 1920 × 1080 à 60 i/s sur chaque couple téléphone/récepteur ; cadence réellement rendue, images perdues et artefacts visuels.
2. Synchro A/V pendant une à deux heures réelles, latence écran-à-écran et latence acoustique, avec les codecs matériels et le réseau réels.
3. Pertes de paquets Wi-Fi, congestion, itinérance entre points d'accès, changement de sous-réseau, réseau IPv6, comportement des routeurs et reconnexion du téléviseur.
4. Chauffe CPU/GPU, consommation, baisse de fréquence et restrictions des constructeurs en arrière-plan. La surveillance thermique et le wake lock ne constituent pas une mesure de ces phénomènes.
5. Compatibilité réelle des Chromecast, Samsung DLNA et LG DLNA. Un nom de marque ne garantit pas le support HLS, H.264/AAC ou 1080p/60.
6. Android 8–14, modèles de TV et firmwares différents. L'émulateur exécuté utilise Android 15.

Le scan automatisé Codex Security demandé plus tôt a échoué à la lecture d'un fichier Gradle verrouillé ; aucun résultat de scan complet n'est présenté comme validé. Les gardes d'appairage, limites HTTP et restrictions d'adresse ont été contrôlées fonctionnellement ; ce n'est pas un audit de sécurité exhaustif. Le flux LAN HTTP reste non chiffré.

## Preuves conservées

Dans le projet : `final-audio-verification.log`, rapports JUnit de `app/build/test-results/testDebugUnitTest/`, et `verification/` : `av-2h-run.log`, `av-2h-frames.framemd5`, `av-2h-decode.log`, `native-protocol-final.json`, `android-lifecycle.json`, `android-resize-recovery.json`, `final-av-sync.json`, `signature-phone.txt`, `signature-tv.txt`.

Les essais intermédiaires qui ont échoué restent dans le dossier de vérification ; ils ne sont pas des validations de la version finale.
