# PhoneMirror TV AirPlay 0.4.2 — préversion

Mise à jour du moteur AirPlay pour Android TV / Google TV, Android 8 minimum. Installer cet APK sur la TV, ouvrir « iPhone / iPad · Ouvrir AirPlay », puis sur l'iPhone : Centre de contrôle → Recopie de l'écran → PhoneMirror. Même réseau local requis. Samsung Tizen et LG webOS ne peuvent pas installer cet APK.

Même application `local.phonemirror.tv.airplay`, versionCode 3, même certificat que 0.4.0/0.4.1 : mise à jour sans désinstallation. Les APK Android téléphone et TV 0.3.1 restent disponibles séparément.

## Corrections effectives du moteur

- Réception vidéo séparée du thread MediaCodec. Aucune attente de 100 ms sur son entrée ; essai immédiat puis nouvelle tentative sur le worker. Une file de 12 images, au plus 8 MiB et 200 ms, absorbe les à-coups courts en conservant les références. Aucun appel au pilote sous le verrou d'admission.
- Changements SPS/PPS et résolution sur décodeur adaptatif, avec configuration complète et image clé envoyées ensemble. Repli vers une recréation du codec si le pilote ne prend pas en charge ce mode ou le refuse.
- Reprise propre après surcharge prolongée : abandon de la chaîne comprimée incomplète puis attente d'une image clé. Cette attente reste nécessaire ; aucune demande d'IDR au téléphone n'est inventée.
- Planification vidéo sur l'horloge monotone et les positions AudioTrack observées ; une image déjà décodée trop ancienne peut être ignorée sans casser les références H.264. Sans audio, horloge vidéo autonome, avec reprise après pause.
- Écritures PCM partielles gérées, sorties audio non bloquantes, buffer réduit selon le minimum système, délai de rattrapage borné, récupération après erreur audio. Flush synchrone sans appel start() invalide ; arrêt des anciens threads avant réutilisation du codec.
- Une connexion HTTP auxiliaire ne remet plus le média à zéro. Une nouvelle session remplaçante termine l'ancienne et ses workers RTP avant de commencer, afin que l'ancien teardown n'arrête pas le nouveau flux.
- Fermeture définitive du worker vidéo à la destruction de l'activité.
- H.265 annoncé seulement avec un décodeur HEVC matériel Main compatible avec la résolution et la cadence annoncées et effectivement créable. Le moteur utilise le composant sélectionné. H.264 est conservé sur les autres TV. Le choix du codec revient à l'iPhone : cette annonce ne force pas H.265. Les bornes des paramètres HEVC sont contrôlées avant lecture.

## Validation et limites

69 tests unitaires AirPlay réussis. Compilation release et lint réussis. Sonde sur émulateur : 90 images à travers deux changements paysage/portrait, un seul démarrage du décodeur adaptatif, aucune perte ; remise à zéro et arrêt/reprise vérifiés (92 images au total). Deux sessions natives et trois connexions auxiliaires vérifiées. Audio AAC-LC : 90 blocs soumis et lus, positions AudioTrack reçues par l'horloge commune, reprise après flush et aucun rattrapage forcé. Les sondes QA sont absentes de l'APK release.

Les mesures 1080p30/60 et leurs éventuels échecs sont dans [le rapport](AUDIT-FLUIDITE-AIRPLAY-0.4.2.md). Une séquence courte en émulateur ne certifie ni le Wi-Fi ni la latence de l'iPhone jusqu'à une TV physique. Les métriques de latence de rendu restent indisponibles lorsque le callback matériel n'est pas exploitable. Le 1080p60 prolongé, AAC-ELD réel, la dérive A/V après 1–2 h, la chauffe et les interruptions Wi-Fi restent à valider sur les appareils réels. Aucun « zéro bug » ni 60 i/s constant n'est garanti.

Les contenus DRM et l'audio seul ALAC ne sont pas pris en charge. AirPlay n'a pas de PIN dans cette préversion : l'activer sur un réseau local de confiance.

## Sources et compilation

Moteur dérivé d'[AirTV](https://github.com/0xb1ob/air-tv), commit `80e958d380e1c9cc609d037c439faec0826bc7b7`, et UxPlay. Les sources adaptées, licences, bibliothèques natives et instructions sont fournies dans `PhoneMirror-TV-AirPlay-0.4.2-sources.zip`. Licence GPL-3.0 et notices natives conservées. Dépendances de la base : OpenSSL 3.0.16 et libplist 2.6.0.

JDK 21, SDK Android 35, NDK 27.2.12479018, CMake 3.22.1, Gradle 8.11.1. Configurer localement `sdk.dir`, puis `gradle :airplay:testDebugUnitTest :tv:assembleRelease :tv:lintRelease`. Signer avec sa propre clé. Les secrets et clés de signature ne sont pas distribués.
