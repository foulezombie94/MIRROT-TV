# PhoneMirror TV AirPlay 0.4.1 — préversion

Version du 22 octobre 2026 pour Android TV / Google TV, Android 8 minimum. Installer cet APK sur la TV, ouvrir « iPhone / iPad · Ouvrir AirPlay », puis utiliser « Centre de contrôle → Recopie de l'écran » sur l'iPhone. Les deux appareils doivent être sur le même réseau local.

Cette version remplace AirPlay 0.4.0 avec le même identifiant `local.phonemirror.tv.airplay` et le même certificat de signature. Elle peut coexister avec PhoneMirror TV 0.3.1, qui reçoit l'écran Android via WebRTC. Les APK téléphone et TV Android 0.3.1 restent inchangés.

## Changements

Les améliorations concernent le diagnostic : callback explicite de rendu, origines distinctes pour les latences depuis le producteur et depuis le submitter, comptage des unités réellement acceptées, détection des sorties invalidées par un flush ou une recréation du codec. La sonde QA utilise des échéances fixes, un producteur indépendant et une file bornée. Elle n'est pas incluse dans l'APK release.

La latence depuis le producteur inclut l'attente en file. Celle depuis le submitter commence après cette attente, mais inclut encore la soumission et le traitement jusqu'à la surface. Aucune n'est présentée comme une mesure du décodage seul. Sans événement de rendu exploitable, elles restent indisponibles.

**Cette mise à jour ne modifie pas les temporisations ni la stratégie de transport/décodage.** Les essais archivés du décodeur ont atteint environ 30 et 60 i/s sur des séquences H.264 1080p courtes, sans réseau ni iPhone. Les derniers passages de la sonde corrigée ont saturé la file dans l'émulateur et sont non concluants pour la performance à 60 i/s. Les 49 tests unitaires et le test des origines de latence passent.

Le [rapport de fluidité](AUDIT-FLUIDITE-AIRPLAY-0.4.1.md) détaille les résultats, la méthode et les limites. Les risques restants comprennent l'attente d'entrée jusqu'à 100 ms en saturation, l'attente d'une nouvelle image clé après rejet, le redémarrage du décodeur sur changement de configuration vidéo, ainsi que la synchronisation A/V réelle.

## Limites et sources

Préversion sans validation sur iPhone et TV physiques. Le profil annoncé est au maximum 1080p60 ; l'iPhone décide des paramètres réels. Aucun 60 i/s constant ni absence totale de coupure n'est garanti. Les contenus DRM et la lecture audio seule ALAC ne sont pas pris en charge. AirPlay n'a pas de PIN dans cette préversion : l'activer sur un réseau local de confiance.

Le moteur utilise UxPlay et dérive d'[AirTV](https://github.com/0xb1ob/air-tv), commit `80e958d380e1c9cc609d037c439faec0826bc7b7`, sous GPL-3.0. Les sources adaptées, notices et instructions sont dans `PhoneMirror-TV-AirPlay-0.4.1-sources.zip`. OpenSSL 3.0.16 et libplist 2.6.0 restent les dépendances natives de la base, avec leurs notices conservées dans l'archive.

Compilation : JDK 21, SDK Android 35, NDK 27.2.12479018, CMake 3.22.1 et Gradle 8.11.1. Configurer `sdk.dir` dans un `local.properties` local puis exécuter `gradle :tv:assembleRelease`. Signer avec sa propre clé ; ne jamais publier les clés ou mots de passe. Les sources des dépendances sont disponibles auprès des projets [OpenSSL](https://github.com/openssl/openssl/releases/tag/openssl-3.0.16) et [libplist](https://github.com/libimobiledevice/libplist/releases/tag/2.6.0).
