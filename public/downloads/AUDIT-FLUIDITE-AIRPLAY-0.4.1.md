# AirPlay — vérification de fluidité du moteur

Vérification du 22 octobre 2026. **Des passages archivés ont atteint environ 60 images/s en décodage H.264 1080p local ; les derniers essais du schéma 2 ont saturé la file et sont non concluants pour la performance. La fluidité complète iPhone → Wi-Fi → TV n'est pas validée.** Aucun iPhone ou téléviseur physique n'était connecté.

## Mesures retenues

Le fixture utilise des unités H.264 préencodées, indexées et validées comme une image par unité, provenant du fichier 1080p60 déjà disponible. Une première image amorce le codec ; le délai de démarrage est enregistré séparément. Après cet amorçage, un producteur indépendant propose les images à échéances monotones fixes, tandis qu'un autre thread appelle le vrai `VideoPipeline.submit()`. La surface est un ImageReader 1920×1080.

| Cadence demandée | Cadence observée en régime établi | Images reçues sur la surface, amorçage inclus | Images rejetées | Plus grand intervalle stable |
| --- | ---: | ---: | ---: | ---: |
| 30 i/s | 30,02 i/s | 180 / 180 | 0 | 42,02 ms |
| 60 i/s | 60,01 i/s | 360 / 360 | 0 | 25,21 ms |

Chaque passage couvre environ six secondes d'injection. Le producteur n'a manqué aucune échéance d'une période complète et la file de soumission n'a pas débordé. Le temps de soumission au 95e percentile est de 9,51 ms à 30 i/s et 3,77 ms à 60 i/s. Ces deux valeurs issues d'un passage de chaque scénario ne constituent pas un classement de performance entre les cadences.

La vidéo utilise directement MediaCodec et une surface, sans attente de segments HLS. Les indices de faible latence sont demandés avec repli si le codec refuse leur configuration. Ces choix permettent un chemin réactif, mais ne suppriment pas le temps de capture, de transport ou d'affichage physique.

## Vérification du détecteur de saccades

Un passage séparé à 60 i/s injecte une pause volontaire de 80 ms dans le thread de soumission, à l'unité 90. Résultats :

- Échéances du producteur inchangées : aucune échéance manquée d'une période entière ; aucun débordement de file.
- Soumission la plus longue : 83,09 ms.
- Attente maximale en file : 66,02 ms ; jusqu'à quatre unités en attente.
- Intervalle maximal observé sur la surface : **98,13 ms**.
- Les 360 images atteignent la surface ; aucune image rejetée.

La sonde expose donc la pause et l'accumulation temporaire de retard même si la moyenne finale reste proche de 60 i/s. La moyenne seule ne doit jamais servir de preuve d'absence de saccades.

## Fiabilité de la sonde corrigée

- Aucun accès par réflexion : `VideoPipeline.setFrameRenderedListener()` fournit le branchement explicite, enregistré avant le démarrage du codec et réappliqué à sa recréation.
- Aucun rapprochement arbitraire entre `Image.getTimestamp()` et les PTS d'entrée. La valeur brute de l'image est conservée uniquement pour diagnostic. La mesure de latence utilise exclusivement les unités explicites du [callback MediaCodec](https://developer.android.com/reference/android/media/MediaCodec.OnFrameRenderedListener) : PTS en microsecondes et temps système en nanosecondes.
- Aucun événement de rendu MediaCodec n'a été reçu sur cette surface lors des essais. Les latences sont donc **nulles au sens « non disponibles » dans le JSON**, et non des durées égales à zéro. Aucune latence de bout en bout n'est annoncée.
- Fin de drain bornée par un délai monotone, avec compte exact des unités réellement acceptées par `queueInputBuffer()` et vérification du dernier PTS libéré. Aucune estimation `soumis - rejetés`, aucun sommeil fixe de 1 200 ms.
- Intervalles calculés uniquement entre deux images de la période stable : aucun intervalle artificiel de zéro pour la première image.
- Échéances fixes `base + i × 1_000_000_000 / fps`, sans déplacement après un ralentissement. File bornée à huit unités ; un débordement interrompt l'injection plutôt que de masquer le problème ou de supprimer silencieusement une référence vidéo.
- PTS calculés directement à partir de l'indice entier avant division, sans accumulation d'un pas tronqué. Import MediaCodec devenu inutile retiré de la sonde.

Les essais précédents en boucle de soumission unique sont remplacés par `verification/airplay-decode-fluidity-open-loop.json`. Le scénario de pause volontaire est dans `verification/airplay-decode-stall-80ms.json`. Ils ne doivent pas être mélangés avec les premières mesures dont le démarrage pouvait entraîner un rattrapage artificiel. Les nombres du tableau décrivent ces passages archivés, pas une certification de la version suivante.

## Correction des origines de latence — schéma 2 / version 0.4.1

La sonde utilise désormais deux maps distinctes : `offeredAt` mémorise la proposition du producteur et `submitAt` le début de travail du submitter. Les champs ambigus `decodeToSurfaceLatency...` sont retirés au profit de `producerToSurfaceLatencyP50Ms/P95Ms` et `submitToSurfaceLatencyP50Ms/P95Ms`. Le premier intervalle inclut l'attente en file ; le second commence après cette attente mais inclut encore la soumission et le traitement jusqu'à la surface. Aucun des deux ne représente le décodage seul. Les valeurs restent indisponibles lorsque le callback ne fournit aucun événement exploitable.

La pause artificielle reste après le début de soumission : elle simule volontairement un submitter bloqué et appartient à `submitDuration`, ainsi qu'aux deux latences lorsqu'elles sont mesurables. Le JSON indique explicitement ce mode d'injection. Les mesures `producerLateness`, `queueWait` et `submitDuration` restent distinctes. Le test JVM `ProbeLatencyCheck` vérifie les deux origines, leur différence égale à l'attente en file, une pause simulée, les PTS absents et les horloges invalides ; il passe.

`framesQueued` compte les unités non vides réellement acceptées par le codec. `framesDropped` compte des rejets avant soumission et ne décrit pas les sorties perdues après acceptation : il n'est donc pas soustrait à `framesQueued`. Un compteur séparé `outputDiscontinuities` signale les flush/libérations susceptibles d'invalider des unités déjà acceptées. Le résultat du drain distingue `all_accepted_output_observed`, `inconclusive_output_invalidated`, `timeout_waiting_for_accepted_output` et `cancelled`. Il signifie que toutes les sorties attendues ont été observées, pas que le matériel est prouvé vide par un EOS.

Deux essais du schéma 2 ont atteint la limite de la file et interrompu l'injection, respectivement après 43 et 27 images soumises, avec `sourceCadenceValid=false`. Toutes les unités acceptées ont atteint la surface et aucune discontinuité du codec n'a été comptée. Ces passages sont **non concluants pour la performance à 60 i/s** et ne remplacent pas les mesures archivées par une affirmation plus favorable. Traces : `verification/airplay-latency-origins-first-attempt.json` et `verification/airplay-latency-origins-second-attempt.json`.

## Risques de fluidité encore présents dans le code publié

1. **Attente sur entrée saturée.** `VideoPipeline` attend jusqu'à 100 ms dans `dequeueInputBuffer()`, depuis le chemin synchrone du callback natif. Une saturation peut donc retarder la réception et la soumission des images suivantes. Les 100 ms sont un maximum d'attente, pas une latence ajoutée à chaque image.
2. **Retour à une image clé après rejet.** Si un buffer d'entrée manque, le pipeline attend une nouvelle image clé pour éviter de décoder des références incomplètes. Cela protège l'image mais peut créer une pause dont la durée dépend de l'iPhone.
3. **Changement de SPS/PPS.** Une nouvelle configuration vidéo libère puis recrée le décodeur. Une rotation ou un changement de résolution AirPlay peut donc produire une pause. Le correctif de rotation WebRTC 0.3.1 ne s'applique pas automatiquement aux paquets vidéo envoyés par l'iPhone.
4. **Rythme réseau et audio/vidéo.** Les images sont présentées dès leur sortie du décodeur. La gigue réseau peut se traduire en irrégularités de présentation ; la synchronisation réelle avec AudioTrack n'a pas été mesurée dans cette sonde.

## Validation et limites

Les **49 tests unitaires AirPlay passent** après réexécution. La compilation QA réussit. L'instrumentation AndroidJUnit initialement tentée n'a pas pu être assemblée hors ligne faute de dépendances de test en cache ; les mesures ci-dessus proviennent de l'activité QA autonome compilée et exécutée dans l'émulateur.

Les ajouts au pipeline sont des points d'observation facultatifs et des compteurs. Les temporisations et la stratégie de lecture ne sont pas modifiées. La version AirPlay 0.4.1 intègre ces points d'observation ; elle ne doit pas être présentée comme une optimisation du transport ou une validation physique de la fluidité.

Ce test n'exerce ni le chiffrement/déchiffrement AirPlay, ni le réseau, ni la capture de l'iPhone, ni l'audio, ni une dalle réelle. Il ne vérifie pas les couleurs par lecture des pixels ni les artefacts sur une TV. La prochaine validation utile est une vraie session iPhone → TV avec défilement, rotations, perturbations Wi-Fi et synchronisation A/V prolongée.
