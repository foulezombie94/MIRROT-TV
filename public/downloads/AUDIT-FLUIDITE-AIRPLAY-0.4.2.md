# Audit du correctif AirPlay 0.4.2

Les corrections de cette version modifient le moteur ; 0.4.1 améliorait surtout le diagnostic. Le délai de dequeue vidéo de 100 ms est remplacé par un essai immédiat et une file indépendante bornée. Les changements de configuration utilisent le décodage adaptatif quand il fonctionne. Le signal A/V utilise des positions audio réellement observées.

## Vérifications automatiques

- 69 tests unitaires AirPlay réussis : types de NAL, paramètres, file bornée, références après saturation, horloge A/V, absence d'audio, wrap 32 bits et chronologie PCM après discontinuité.
- Build release et lint Android réussis. Les tests JVM RTC ont également été exécutés.
- Annonce HEVC contrôlée dans la réponse binaire RTSP `/info` du serveur réel : bit 42 absent en H.264 (`0x5a7ffee6`) et présent lorsque HEVC est activé (`0x4005a7ffee6`). La sélection du décodeur est filtrée par capacité matérielle, profil Main, résolution et cadence. Le décodage HEVC provenant d'un iPhone reste à vérifier physiquement.
- Serveur natif réel dans l'émulateur : deux sessions de contrôle, trois connexions HTTP auxiliaires, aucun démarrage/arrêt média dû aux connexions auxiliaires. Le remplacement termine l'ancien propriétaire avant l'admission du nouveau.
- Décodage réel MediaCodec : 640×360 → 360×640 → 640×360, 90 images, 0 perte, 1 démarrage et 2 changements adaptatifs. Flush et arrêt/reprise ajoutent deux sorties correctement reçues.
- AAC-LC / AudioTrack : 90 blocs soumis, 90 lus, 245 observations d'horloge, 0 remise à zéro pour retard, arrêt en 3.92 ms. EOS explicite pour la sonde finie : on n'assimile pas les images en attente interne du décodeur à des pertes.

## Mesures courtes 1080p dans l'émulateur

| FPS demandés | Blocage injecté au submitter | FPS surface en régime établi | Unités comprimées rejetées | Soumission P95 | Écart surface max | Cadence source valide |
| --- | --- | --- | --- | --- | --- | --- |
| 30 | 0 ms | 30.01 | 0 | 4.60 ms | 39.99 ms | oui |
| 60 | 0 ms | 60.45 | 0 | 9.64 ms | 53.18 ms | non |
| 60 | 80 ms | 60.70 | 0 | 10.55 ms | 106.57 ms | non |

Le blocage injecté de 80 ms simule un appel submitter retardé. Ce n'est pas une émulation de perte Wi-Fi ni une mesure réseau. Les échéances du producteur restent fixes et ses retards sont conservés. « FPS surface » décrit le régime établi ; il ne prouve pas l'absence de gel pendant toute la séquence. Les traces détaillées et les essais précédents sont conservés dans `verification/` de l'archive source, y compris les passages avec pertes ou cadence invalide.

Un premier essai avec une file de 8 images/150 ms a révélé un dépassement pendant un à-coup du producteur. La borne finale de 12 images/200 ms absorbe un à-coup court plus long sans laisser croître indéfiniment le retard. Les sorties décodées devenues trop anciennes peuvent être ignorées, sans supprimer une référence comprimée isolée. Après dépassement durable, l'attente d'une image clé reste nécessaire.

Les callbacks OnFrameRendered exploitables n'étaient pas disponibles dans cette configuration ImageReader : les latences producteur→surface et submitter→surface restent nulles. Aucun chiffre de latence bout-en-bout n'en est déduit. Le scénario de rotation est un test fonctionnel avec barrières, pas un benchmark de cadence.

## Éléments restant à valider physiquement

Pas d'iPhone ni de TV physique connectés à cet environnement. Absence de certification pour le 1080p60 constant, artefacts sur les différents pilotes, décalage A/V pendant 1–2 h, AAC-ELD d'un iPhone, latence de capture/transport/panneau, pertes Wi-Fi, roaming, veille et chauffe. La saturation durable impose encore une reprise sur image clé. Un pilote sans décodage adaptatif redémarre encore son codec lors d'un changement de résolution. Cette version reste une préversion.
