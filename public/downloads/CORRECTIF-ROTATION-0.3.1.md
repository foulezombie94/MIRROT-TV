# PhoneMirror 0.3.1 — correctif de rotation

Livraison du 22 octobre 2026. Le changement paysage/portrait ne force plus, à lui seul, l'inversion largeur/hauteur des buffers envoyés au codec WebRTC. Dans les essais isolés à 30 images/s, le gel de rotation auparavant reproduit à 236–237 ms n'est plus comptabilisé.

## Correction

Les images portrait sont présentées au codec avec un buffer paysage et une orientation vidéo WebRTC complémentaire. Le récepteur rétablit le portrait à l'affichage. Le contenu reste entier, sans ajout de bandes dans la vidéo, déformation ni réduction systématique de la résolution portrait.

Sur la capture GPU du téléphone, cette opération utilise une transformation de texture avec comptage des références : aucun transfert des pixels vers le CPU ni framebuffer supplémentaire n'est ajouté. Une rotation I420 est disponible pour les sources mémoire et la sonde de test. Les horodatages et les orientations d'entrée sont conservés correctement. L'adaptation de capture existante reste active lors des changements d'écran ; c'est la géométrie des buffers remis au codec qui est normalisée.

Le correctif porte sur le mode WebRTC avec l'application PhoneMirror TV. Il ne change pas le transport HLS de Google Cast / DLNA. L'adaptation automatique de résolution pour des raisons de débit ou de charge reste possible ; cette version ne garantit pas l'absence de tout redimensionnement du codec.

## Vérifications

- Rotation des pixels vérifiée sur buffers I420 et textures GPU, plans Y/U/V, quatre rotations d'entrée, horodatages et durée de vie des buffers.
- Extension RTP d'orientation négociée et reçue dans les essais natifs.
- Démarrage paysage avec une rotation : compteur de gel nul.
- Rotations répétées et tentative de reprise ICE : compteur de gel nul, une seule initialisation du décodeur.
- Dernier essai démarrant en portrait à 30 images/s, avec adaptation de format comme dans la capture : 863 images décodées sur 900 émises, son synthétique reçu, compteur de gel nul, une seule initialisation du décodeur. Les dimensions encodées restent 1280×720 ; les dimensions affichées alternent bien entre 720×1280 et 1280×720. L'espacement maximal entre images décodées après les trois premières secondes est d'environ 52 ms.
- 35 tests unitaires réussis ; compilation release téléphone/TV et lint sans erreur.
- Deux APK version 0.3.1, code 4, Android 8 minimum ; signatures v2/v3 et alignement des bibliothèques natives à 16 Ko vérifiés. Même certificat que les versions précédentes.
- Mise à jour et lancement des deux APK dans l'émulateur Android 15 réussis, sans exception AndroidRuntime observée.

## Limites des essais de fluidité

Les tests utilisent un encodeur VP8 logiciel et un récepteur dans le même émulateur, avec une mire synthétique. Ils ne mesurent pas le délai jusqu'à une dalle TV réelle ni le H.264 matériel d'un téléphone.

Un premier essai démarrant en portrait a enregistré un gel de 232 ms avant la première rotation ; le dernier essai isolé décrit ci-dessus ne l'a pas reproduit. L'essai demandant 60 images/s n'a pas tenu cette cadence : l'émulateur a décodé 455 images sur 1 200 et compté deux gels totalisant 550 ms, avant la première rotation. Malgré cela, les rotations suivantes ont conservé la même instance de décodeur. Ces observations ne permettent pas d'annoncer zéro saccade générale ni 1080p60 constant.

Le correctif supprime le mécanisme de réinitialisation lié au basculement portrait/paysage pour les récepteurs négociant l'orientation WebRTC. Si un récepteur ne négocie pas cette extension, WebRTC conserve sa gestion de rotation de compatibilité ; le même gain n'est pas garanti. Sur téléphone et TV physiques, vérifier le sens et les proportions de l'image, plusieurs rotations, l'audio et une session prolongée.

## Installation

Installer **PhoneMirror-Android-0.3.1.apk** sur le téléphone et **PhoneMirror-TV-0.3.1.apk** sur Android TV / Google TV. Les signatures permettent la mise à jour des versions officielles précédentes sans désinstallation. Une application provenant d'une autre clé de signature peut nécessiter une désinstallation préalable.

Les APK ne s'installent pas directement sur Samsung Tizen ou LG webOS. Ces téléviseurs nécessitent un récepteur compatible, un Chromecast ou un boîtier Android TV / Google TV ; leur chemin Cast/DLNA reste HLS.

Les traces source de cette validation se trouvent dans `verification/rotation-fix/`, `verification/rotation-fix-adaptation/` et `verification/rotation-fix-release-build.log`. Les tests QA ne sont pas inclus dans les APK release. Les empreintes des deux téléchargements figurent dans `SHA256.json`.
