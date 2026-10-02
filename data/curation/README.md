# Corrections manuelles (curation)

Ces fichiers sont relus à la main et prennent le dessus sur les sources automatiques.
Le script `scripts/data/build.ts` les applique, `scripts/data/validate.ts` vérifie le résultat.

| Fichier | Rôle |
|---|---|
| `membership.json` | Corrige l'appartenance à l'ONU quand les sources se contredisent, liste les observateurs. |
| `names.json` | Nom affiché quand le nom CLDR n'est pas le plus courant, noms alternatifs acceptés en saisie. |
| `capitals.json` | Capitale principale pour les pays à plusieurs capitales, autres orthographes acceptées. |
| `grammar.json` | Article du nom de pays (« la France », « le Japon », « les Pays-Bas », « Cuba »…). |
| `difficulty.json` | Ajustements du niveau de difficulté calculé automatiquement. |
| `flags.json` | Groupes de drapeaux qui se ressemblent (distracteurs des QCM difficiles). |
