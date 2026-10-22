# PhoneMirror TV AirPlay 0.4.0 — préversion

Ce récepteur Android TV / Google TV ajoute AirPlay pour la recopie de l'écran de l'iPhone, sans application iOS, Mac ou abonnement Apple Developer. Il s'installe **sur la TV** et utilise le paquet distinct `local.phonemirror.tv.airplay` : il peut coexister avec PhoneMirror TV 0.3.1.

## Utilisation

1. Installer `PhoneMirror-TV-AirPlay-0.4.0.apk` sur une TV Android 8 ou plus récente (ARM 64 bits, ARM 32 bits ou x86_64).
2. Ouvrir **PhoneMirror TV AirPlay**, puis **iPhone / iPad · Ouvrir AirPlay**.
3. Mettre l'iPhone et la TV sur le même réseau local, sans isolation des clients Wi-Fi.
4. Sur l'iPhone : **Centre de contrôle → Recopie de l'écran → PhoneMirror · nom de la TV**.
5. Utiliser Retour sur la télécommande pour arrêter la réception.

## Fonctionnement et limites

Le protocole natif UxPlay est relié à MediaCodec et AudioTrack par JNI. Il annonce un profil maximal 1080p60 ; l'iPhone décide de la résolution et de la cadence effectives. Les proportions de l'image sont conservées, y compris en portrait. Le son de la recopie AAC-ELD et le son AAC-LC sont pris en charge. La lecture audio seule en ALAC et les contenus protégés par DRM ne sont pas pris en charge. L'activation d'AirPlay est explicite ; quitter cette vue arrête le serveur. Il n'y a pas de code PIN AirPlay dans cette préversion : utiliser un réseau local de confiance.

Les bibliothèques natives sont compilées depuis les sources pour arm64-v8a, armeabi-v7a et x86_64, avec des segments ELF alignés à 16 Ko. Les paquets trop grands ou incompatibles avec le buffer du décodeur sont refusés. Après perte d'une image par saturation du décodeur, le chemin vidéo attend une nouvelle image clé au lieu de poursuivre avec des références incomplètes.

**Compilation release réussie et APK signé. Aucune validation sur un iPhone et une TV physiques n'a été réalisée.** Aucun test supplémentaire n'est exécuté après la demande de livraison sans tests. Le premier passage lancé avant cette demande comportait 49 tests unitaires : 47 réussis et deux assertions héritées exigeant une annonce 4K, devenues incompatibles avec la limite volontaire 1080p. Ces deux assertions ont été mises à jour, sans réexécution. Il ne faut donc pas présenter l'ensemble des tests comme validé. La fluidité à 60 fps, la synchronisation A/V longue durée et la compatibilité réelle doivent être vérifiées sur les appareils avant une diffusion en production.

## Sources et licences

Cette version dérive d'[AirTV](https://github.com/0xb1ob/air-tv), commit `80e958d380e1c9cc609d037c439faec0826bc7b7`, sous GPL-3.0, et de son moteur UxPlay. Le namespace tiers est conservé pour l'interface JNI. Les sources adaptées, notices et instructions de compilation sont fournies dans `PhoneMirror-TV-AirPlay-0.4.0-sources.zip`.

Les dépendances natives précompilées de la base sont OpenSSL 3.0.16 et libplist 2.6.0. Leurs sources correspondantes sont disponibles ici :

- [OpenSSL 3.0.16](https://github.com/openssl/openssl/releases/tag/openssl-3.0.16) — licence Apache-2.0.
- [libplist 2.6.0](https://github.com/libimobiledevice/libplist/releases/tag/2.6.0) — licence LGPL-2.1 ou ultérieure.

Pour compiler : JDK 21, Android SDK 35, NDK 27.2.12479018, CMake 3.22.1 et Gradle 8.11.1 ; renseigner `sdk.dir` dans un `local.properties` local puis exécuter `gradle :tv:assembleRelease`. Signer l'APK avec sa propre clé. Ne pas publier de clé ou de mot de passe dans les sources. Le script de reconstruction des dépendances natives est conservé dans `third_party/build-native-deps.sh` ; il est issu d'AirTV et requiert un environnement Linux/macOS avec NDK.
