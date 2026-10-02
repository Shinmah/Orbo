# Rapport de vérification des données

Généré par `npm run data:validate` — données du 2026-10-02.

**Résultat : ✅ aucune erreur**

## Synthèse

| Vérification | Résultat |
|---|---|
| États membres de l'ONU | 193 / 193 ✅ |
| États observateurs (Vatican, Palestine) | 2 / 2 ✅ |
| **Total des pays jouables** | **195** |
| Pays sans capitale | 0 ✅ |
| Drapeaux SVG présents et valides | 195 / 195 ✅ |
| Pays avec une forme sur la carte | 195 / 195 ✅ |
| Noms ambigus entre deux pays | 0 ✅ |
| Nom d'un pays accepté pour un autre | 0 ✅ |
| Frontières terrestres (symétriques) | 312 paires ✅ |
| Tests de saisie tolérante | 26 / 26 ✅ |



## Répartition

| Continent | Pays |
|---|---|
| Afrique | 54 |
| Amérique du Nord (avec Amérique centrale et Caraïbes) | 23 |
| Amérique du Sud | 12 |
| Asie | 48 |
| Europe | 46 |
| Océanie | 14 |

Russie et Turquie comptent à la fois en Europe et en Asie.

| Niveau | Pays | Liste |
|---|---|---|
| 1 | 45 | Argentine, Australie, Autriche, Belgique, Brésil, Canada, Suisse, Chili, Chine, Côte d'Ivoire, Colombie, Allemagne, Danemark, Algérie, Égypte, Espagne, France, Royaume-Uni, Grèce, Indonésie, Inde, Irlande, Iran, Israël, Italie, Japon, Corée du Sud, Maroc, Mexique, Pays-Bas, Norvège, Pérou, Pologne, Portugal, Russie, Arabie saoudite, Sénégal, Suède, Thaïlande, Tunisie, Turquie, Ukraine, États-Unis, Vietnam, Afrique du Sud |
| 2 | 60 | Afghanistan, Angola, Albanie, Émirats arabes unis, Arménie, Azerbaïdjan, Burkina Faso, Bangladesh, Bulgarie, Bosnie-Herzégovine, Biélorussie, Cameroun, République démocratique du Congo, Cuba, Chypre, Tchéquie, Équateur, Éthiopie, Finlande, Géorgie, Ghana, Croatie, Haïti, Hongrie, Irak, Islande, Kazakhstan, Kenya, Cambodge, Liban, Libye, Sri Lanka, Lituanie, Luxembourg, Madagascar, Mali, Malte, Birmanie, Malaisie, Nigeria, Népal, Nouvelle-Zélande, Pakistan, Philippines, Corée du Nord, Roumanie, Soudan, Singapour, Somalie, Serbie, Slovaquie, Syrie, Tchad, Tanzanie, Ouganda, Ouzbékistan, Venezuela, Yémen, Zambie, Zimbabwe |
| 3 | 63 | Andorre, Burundi, Bénin, Bahreïn, Bahamas, Bolivie, Brunei, Bhoutan, Botswana, République centrafricaine, République du Congo, Cap-Vert, Costa Rica, Djibouti, République dominicaine, Érythrée, Estonie, Fidji, Gabon, Guinée, Gambie, Guatemala, Guyana, Honduras, Jamaïque, Jordanie, Kirghizistan, Koweït, Laos, Liberia, Liechtenstein, Lettonie, Monaco, Moldavie, Maldives, Macédoine du Nord, Monténégro, Mongolie, Mozambique, Mauritanie, Maurice, Malawi, Namibie, Niger, Nicaragua, Oman, Panama, Papouasie-Nouvelle-Guinée, Paraguay, Palestine, Qatar, Rwanda, Sierra Leone, Salvador, Saint-Marin, Soudan du Sud, Slovénie, Togo, Tadjikistan, Turkménistan, Trinité-et-Tobago, Uruguay, Vatican |
| 4 | 27 | Antigua-et-Barbuda, Belize, Barbade, Comores, Dominique, Micronésie, Guinée-Bissau, Guinée équatoriale, Grenade, Kiribati, Saint-Christophe-et-Niévès, Sainte-Lucie, Lesotho, Îles Marshall, Nauru, Palaos, Îles Salomon, Sao Tomé-et-Principe, Suriname, Eswatini, Seychelles, Timor oriental, Tonga, Tuvalu, Saint-Vincent-et-les-Grenadines, Vanuatu, Samoa |

## Cas particuliers des capitales

| Pays | Capitale retenue | Aussi acceptées en saisie | Note |
|---|---|---|---|
| Burundi | Gitega | — | Bujumbura reste la capitale économique. |
| Bénin | Porto-Novo | Cotonou | Porto-Novo est la capitale officielle, Cotonou le siège du gouvernement. |
| Bolivie | Sucre | La Paz | Sucre est la capitale constitutionnelle, La Paz le siège du gouvernement. |
| Suisse | Berne | Bern | Officiellement, Berne est la « ville fédérale ». |
| Côte d'Ivoire | Yamoussoukro | — | Abidjan est la capitale économique. |
| Guinée équatoriale | Ciudad de la Paz | Malabo, Oyala | Malabo, l'ancienne capitale, est aussi acceptée. |
| Sri Lanka | Sri Jayawardenapura Kotte | Sri Jayawardenapura, Kotte, Colombo, Sri Jayawardenepura Kotte | Colombo est la capitale commerciale. |
| Malaisie | Kuala Lumpur | Putrajaya | Putrajaya est le siège du gouvernement. |
| Pays-Bas | Amsterdam | — | Le gouvernement siège à La Haye. |
| Nauru | Yaren | Yaren District | Nauru n'a pas de capitale officielle : Yaren abrite les institutions. |
| Palestine | Jérusalem-Est | Ramallah, East Jerusalem | Ramallah est le siège de l'Autorité palestinienne. |
| Eswatini | Mbabane | Lobamba | Lobamba est la capitale royale et législative. |
| Tanzanie | Dodoma | — | Dar es Salaam reste la capitale économique. |
| Yémen | Sanaa | Aden | Aden sert de capitale provisoire au gouvernement reconnu. |
| Afrique du Sud | Pretoria | Le Cap, Cape Town, Bloemfontein | Le pays a trois capitales : Pretoria (exécutif), Le Cap (parlement) et Bloemfontein (justice). |

Exclus des questions « capitale → pays » (réponse ambiguë) : Israël, Palestine.

## Saisie libre : tests de référence

| Saisie | Question | Attendu | OK |
|---|---|---|---|
| `cote d'ivoire` | Côte d'Ivoire | acceptée | ✅ |
| `COTE-D IVOIRE` | Côte d'Ivoire | acceptée | ✅ |
| `Myanmar` | Birmanie | acceptée | ✅ |
| `Birmanie` | Birmanie | acceptée | ✅ |
| `RDC` | République démocratique du Congo | acceptée | ✅ |
| `la france` | France | acceptée | ✅ |
| `les pays bas` | Pays-Bas | acceptée | ✅ |
| `Kazakstan` | Kazakhstan | acceptée | ✅ |
| `Ouzbekistan` | Ouzbékistan | acceptée | ✅ |
| `Niger` | Nigeria | refusée | ✅ |
| `Irak` | Iran | refusée | ✅ |
| `Gambie` | Zambie | refusée | ✅ |
| `Slovaquie` | Slovénie | refusée | ✅ |
| `Autriche` | Australie | refusée | ✅ |
| `ouagadougou` | capitale du Burkina Faso | acceptée | ✅ |
| `Ouagadougu` | capitale du Burkina Faso | acceptée | ✅ |
| `pekin` | capitale de la Chine | acceptée | ✅ |
| `Beijing` | capitale de la Chine | acceptée | ✅ |
| `Kyiv` | capitale de l'Ukraine | acceptée | ✅ |
| `le cap` | capitale de l'Afrique du Sud | acceptée | ✅ |
| `La Paz` | capitale de la Bolivie | acceptée | ✅ |
| `nukualofa` | capitale des Tonga | acceptée | ✅ |
| `Chisinau` | capitale de la Moldavie | acceptée | ✅ |
| `ndjamena` | capitale du Tchad | acceptée | ✅ |
| `Sydney` | capitale de l'Australie | refusée | ✅ |
| `Kingstown` | capitale de la Jamaïque | refusée | ✅ |

Noms de pays proches (distance ≤ 2) — une saisie plus proche d'un autre pays est refusée :
Burundi / Brunei (2) · Canada / Panama (2) · Chili / Chine (2) · Estonie / Lettonie (2) · Finlande / Irlande (2) · Finlande / Islande (2) · Gabon / Japon (2) · Ghana / Guyana (2) · Gambie / Namibie (2) · Gambie / Zambie (1) · Irlande / Islande (1) · Iran / Irak (1) · Iran / Liban (2) · Iran / Oman (2) · Laos / Palaos (2) · Liban / Libye (2) · Liberia / Nigeria (2) · Mali / Malte (2) · Mali / Malawi (2) · Namibie / Zambie (2) · Niger / Nigeria (2) · Serbie / Syrie (2) · Togo / Tonga (2)

## Désaccords entre sources (résolus)

- ONU : DNK membre selon mledoze, pas selon Wikidata
- ONU : VAT membre selon mledoze, pas selon Wikidata
- Capitale ATG : Wikidata «  » ≠ mledoze « Saint John's » → retenue : Saint John's
- Capitale GNQ : Wikidata « Ciudad de la Paz » ≠ mledoze « Malabo » → retenue : Ciudad de la Paz
- Capitale MNG : Wikidata « Ulaanbaatar » ≠ mledoze « Ulan Bator » → retenue : Oulan-Bator
- Capitale NRU : Wikidata « Yaren District » ≠ mledoze « Yaren » → retenue : Yaren
- Capitale SMR : Wikidata « San Marino » ≠ mledoze « City of San Marino » → retenue : Saint-Marin

## Frontières terrestres (jeu « Chemin »)

- 312 frontières, toutes symétriques.
- Blocs de pays reliés par la terre : 130 pays (dont Afghanistan, Chine, Iran…) ; 22 pays (dont Argentine, Bolivie, Brésil…) ; 2 pays (République dominicaine, Haïti) ; 2 pays (Royaume-Uni, Irlande).
- 39 pays sans frontière terrestre (îles), jamais choisis comme départ ou arrivée : Antigua-et-Barbuda, Australie, Bahreïn, Bahamas, Barbade, Comores, Cap-Vert, Cuba, Chypre, Dominique, Fidji, Micronésie, Grenade, Islande, Jamaïque, Japon, Kiribati, Saint-Christophe-et-Niévès, Sainte-Lucie, Sri Lanka, Madagascar, Maldives, Îles Marshall, Malte, Maurice, Nauru, Nouvelle-Zélande, Philippines, Palaos, Singapour, Îles Salomon, Sao Tomé-et-Principe, Seychelles, Tonga, Trinité-et-Tobago, Tuvalu, Saint-Vincent-et-les-Grenadines, Vanuatu, Samoa.

Corrections et cas particuliers :
- BWA–ZMB : selon mledoze seulement (trop petite pour la carte simplifiée)
- ESP–MAR : selon mledoze seulement (trop petite pour la carte simplifiée)
- ISR–SYR : selon mledoze seulement (trop petite pour la carte simplifiée)
- IND–LKA : selon mledoze seulement (trop petite pour la carte simplifiée)
- FRA–SUR : présente sur la carte seulement
- BRA–FRA : présente sur la carte seulement
- MAR–MRT : présente sur la carte seulement
- BRA–FRA : retirée (Frontière de la Guyane (outre-mer) : on garde le jeu centré sur les territoires principaux.)
- FRA–SUR : retirée (Idem (Guyane).)
- IND–LKA : retirée (Pas de frontière terrestre (détroit de Palk).)

## Carte

- Source : Natural Earth 1:10m, version « point de vue France » (domaine public), projection de Miller.
- 244 formes, dont 195 pays jouables et 49 territoires affichés en gris (non cliquables) : ESB, MAF, SXM, KOS, BRI, GIB, WSB, BRT, GRL, NCL, CUW, ABW, TCA, TWN, SPM, PCN, PYF, ATF, UMI, MSR, VIR, BLM, PRI, AIA, VGB, CYM, BMU, HMD, SHN, JEY, GGY, IMN, FRO, IOA, IOT, NFK, COK, WLF, SGS, FLK, NIU, ASM, GUM, MNP, CSI, PGA, CLP, ATC, SCR.
- 64 îlots minuscules retirés pour alléger la carte (jamais la dernière forme d'un pays).
- 43 pays trop petits pour être cliqués à l'échelle du monde, affichés avec un marqueur : Andorre, Antigua-et-Barbuda, Bahreïn, Bahamas, Barbade, Brunei, Comores, Cap-Vert, Chypre, Dominique, Fidji, Micronésie, Gambie, Grenade, Jamaïque, Kiribati, Saint-Christophe-et-Niévès, Liban, Sainte-Lucie, Liechtenstein, Luxembourg, Monaco, Maldives, Îles Marshall, Malte, Maurice, Nauru, Palaos, Palestine, Qatar, Singapour, Îles Salomon, Saint-Marin, Sao Tomé-et-Principe, Seychelles, Timor oriental, Tonga, Trinité-et-Tobago, Tuvalu, Vatican, Saint-Vincent-et-les-Grenadines, Vanuatu, Samoa.

<details><summary>Formulations générées pour les 195 pays (relecture grammaticale)</summary>

- Quelle est la capitale de l'Afghanistan ? → Kaboul
- Quelle est la capitale de l'Angola ? → Luanda
- Quelle est la capitale de l'Albanie ? → Tirana
- Quelle est la capitale de l'Andorre ? → Andorre-la-Vieille
- Quelle est la capitale des Émirats arabes unis ? → Abou Dabi
- Quelle est la capitale de l'Argentine ? → Buenos Aires
- Quelle est la capitale de l'Arménie ? → Erevan
- Quelle est la capitale d'Antigua-et-Barbuda ? → Saint John's
- Quelle est la capitale de l'Australie ? → Canberra
- Quelle est la capitale de l'Autriche ? → Vienne
- Quelle est la capitale de l'Azerbaïdjan ? → Bakou
- Quelle est la capitale du Burundi ? → Gitega
- Quelle est la capitale de la Belgique ? → Bruxelles
- Quelle est la capitale du Bénin ? → Porto-Novo
- Quelle est la capitale du Burkina Faso ? → Ouagadougou
- Quelle est la capitale du Bangladesh ? → Dacca
- Quelle est la capitale de la Bulgarie ? → Sofia
- Quelle est la capitale de Bahreïn ? → Manama
- Quelle est la capitale des Bahamas ? → Nassau
- Quelle est la capitale de la Bosnie-Herzégovine ? → Sarajevo
- Quelle est la capitale de la Biélorussie ? → Minsk
- Quelle est la capitale du Belize ? → Belmopan
- Quelle est la capitale de la Bolivie ? → Sucre
- Quelle est la capitale du Brésil ? → Brasilia
- Quelle est la capitale de la Barbade ? → Bridgetown
- Quelle est la capitale du Brunei ? → Bandar Seri Begawan
- Quelle est la capitale du Bhoutan ? → Thimphou
- Quelle est la capitale du Botswana ? → Gaborone
- Quelle est la capitale de la République centrafricaine ? → Bangui
- Quelle est la capitale du Canada ? → Ottawa
- Quelle est la capitale de la Suisse ? → Berne
- Quelle est la capitale du Chili ? → Santiago
- Quelle est la capitale de la Chine ? → Pékin
- Quelle est la capitale de la Côte d'Ivoire ? → Yamoussoukro
- Quelle est la capitale du Cameroun ? → Yaoundé
- Quelle est la capitale de la République démocratique du Congo ? → Kinshasa
- Quelle est la capitale de la République du Congo ? → Brazzaville
- Quelle est la capitale de la Colombie ? → Bogota
- Quelle est la capitale des Comores ? → Moroni
- Quelle est la capitale du Cap-Vert ? → Praia
- Quelle est la capitale du Costa Rica ? → San José
- Quelle est la capitale de Cuba ? → La Havane
- Quelle est la capitale de Chypre ? → Nicosie
- Quelle est la capitale de la Tchéquie ? → Prague
- Quelle est la capitale de l'Allemagne ? → Berlin
- Quelle est la capitale de Djibouti ? → Djibouti
- Quelle est la capitale de la Dominique ? → Roseau
- Quelle est la capitale du Danemark ? → Copenhague
- Quelle est la capitale de la République dominicaine ? → Saint-Domingue
- Quelle est la capitale de l'Algérie ? → Alger
- Quelle est la capitale de l'Équateur ? → Quito
- Quelle est la capitale de l'Égypte ? → Le Caire
- Quelle est la capitale de l'Érythrée ? → Asmara
- Quelle est la capitale de l'Espagne ? → Madrid
- Quelle est la capitale de l'Estonie ? → Tallinn
- Quelle est la capitale de l'Éthiopie ? → Addis-Abeba
- Quelle est la capitale de la Finlande ? → Helsinki
- Quelle est la capitale des Fidji ? → Suva
- Quelle est la capitale de la France ? → Paris
- Quelle est la capitale de la Micronésie ? → Palikir
- Quelle est la capitale du Gabon ? → Libreville
- Quelle est la capitale du Royaume-Uni ? → Londres
- Quelle est la capitale de la Géorgie ? → Tbilissi
- Quelle est la capitale du Ghana ? → Accra
- Quelle est la capitale de la Guinée ? → Conakry
- Quelle est la capitale de la Gambie ? → Banjul
- Quelle est la capitale de la Guinée-Bissau ? → Bissau
- Quelle est la capitale de la Guinée équatoriale ? → Ciudad de la Paz
- Quelle est la capitale de la Grèce ? → Athènes
- Quelle est la capitale de la Grenade ? → Saint-Georges
- Quelle est la capitale du Guatemala ? → Guatemala
- Quelle est la capitale du Guyana ? → Georgetown
- Quelle est la capitale du Honduras ? → Tegucigalpa
- Quelle est la capitale de la Croatie ? → Zagreb
- Quelle est la capitale d'Haïti ? → Port-au-Prince
- Quelle est la capitale de la Hongrie ? → Budapest
- Quelle est la capitale de l'Indonésie ? → Jakarta
- Quelle est la capitale de l'Inde ? → New Delhi
- Quelle est la capitale de l'Irlande ? → Dublin
- Quelle est la capitale de l'Iran ? → Téhéran
- Quelle est la capitale de l'Irak ? → Bagdad
- Quelle est la capitale de l'Islande ? → Reykjavik
- Quelle est la capitale d'Israël ? → Jérusalem
- Quelle est la capitale de l'Italie ? → Rome
- Quelle est la capitale de la Jamaïque ? → Kingston
- Quelle est la capitale de la Jordanie ? → Amman
- Quelle est la capitale du Japon ? → Tokyo
- Quelle est la capitale du Kazakhstan ? → Astana
- Quelle est la capitale du Kenya ? → Nairobi
- Quelle est la capitale du Kirghizistan ? → Bichkek
- Quelle est la capitale du Cambodge ? → Phnom Penh
- Quelle est la capitale de Kiribati ? → Tarawa-Sud
- Quelle est la capitale de Saint-Christophe-et-Niévès ? → Basseterre
- Quelle est la capitale de la Corée du Sud ? → Séoul
- Quelle est la capitale du Koweït ? → Koweït
- Quelle est la capitale du Laos ? → Vientiane
- Quelle est la capitale du Liban ? → Beyrouth
- Quelle est la capitale du Liberia ? → Monrovia
- Quelle est la capitale de la Libye ? → Tripoli
- Quelle est la capitale de Sainte-Lucie ? → Castries
- Quelle est la capitale du Liechtenstein ? → Vaduz
- Quelle est la capitale du Sri Lanka ? → Sri Jayawardenapura Kotte
- Quelle est la capitale du Lesotho ? → Maseru
- Quelle est la capitale de la Lituanie ? → Vilnius
- Quelle est la capitale du Luxembourg ? → Luxembourg
- Quelle est la capitale de la Lettonie ? → Riga
- Quelle est la capitale du Maroc ? → Rabat
- Quelle est la capitale de Monaco ? → Monaco
- Quelle est la capitale de la Moldavie ? → Chișinău
- Quelle est la capitale de Madagascar ? → Antananarivo
- Quelle est la capitale des Maldives ? → Malé
- Quelle est la capitale du Mexique ? → Mexico
- Quelle est la capitale des îles Marshall ? → Majuro
- Quelle est la capitale de la Macédoine du Nord ? → Skopje
- Quelle est la capitale du Mali ? → Bamako
- Quelle est la capitale de Malte ? → La Valette
- Quelle est la capitale de la Birmanie ? → Naypyidaw
- Quelle est la capitale du Monténégro ? → Podgorica
- Quelle est la capitale de la Mongolie ? → Oulan-Bator
- Quelle est la capitale du Mozambique ? → Maputo
- Quelle est la capitale de la Mauritanie ? → Nouakchott
- Quelle est la capitale de Maurice ? → Port-Louis
- Quelle est la capitale du Malawi ? → Lilongwe
- Quelle est la capitale de la Malaisie ? → Kuala Lumpur
- Quelle est la capitale de la Namibie ? → Windhoek
- Quelle est la capitale du Niger ? → Niamey
- Quelle est la capitale du Nigeria ? → Abuja
- Quelle est la capitale du Nicaragua ? → Managua
- Quelle est la capitale des Pays-Bas ? → Amsterdam
- Quelle est la capitale de la Norvège ? → Oslo
- Quelle est la capitale du Népal ? → Katmandou
- Quelle est la capitale de Nauru ? → Yaren
- Quelle est la capitale de la Nouvelle-Zélande ? → Wellington
- Quelle est la capitale d'Oman ? → Mascate
- Quelle est la capitale du Pakistan ? → Islamabad
- Quelle est la capitale du Panama ? → Panama
- Quelle est la capitale du Pérou ? → Lima
- Quelle est la capitale des Philippines ? → Manille
- Quelle est la capitale des Palaos ? → Ngerulmud
- Quelle est la capitale de la Papouasie-Nouvelle-Guinée ? → Port Moresby
- Quelle est la capitale de la Pologne ? → Varsovie
- Quelle est la capitale de la Corée du Nord ? → Pyongyang
- Quelle est la capitale du Portugal ? → Lisbonne
- Quelle est la capitale du Paraguay ? → Asuncion
- Quelle est la capitale de la Palestine ? → Jérusalem-Est
- Quelle est la capitale du Qatar ? → Doha
- Quelle est la capitale de la Roumanie ? → Bucarest
- Quelle est la capitale de la Russie ? → Moscou
- Quelle est la capitale du Rwanda ? → Kigali
- Quelle est la capitale de l'Arabie saoudite ? → Riyad
- Quelle est la capitale du Soudan ? → Khartoum
- Quelle est la capitale du Sénégal ? → Dakar
- Quelle est la capitale de Singapour ? → Singapour
- Quelle est la capitale des îles Salomon ? → Honiara
- Quelle est la capitale de la Sierra Leone ? → Freetown
- Quelle est la capitale du Salvador ? → San Salvador
- Quelle est la capitale de Saint-Marin ? → Saint-Marin
- Quelle est la capitale de la Somalie ? → Mogadiscio
- Quelle est la capitale de la Serbie ? → Belgrade
- Quelle est la capitale du Soudan du Sud ? → Djouba
- Quelle est la capitale de Sao Tomé-et-Principe ? → São Tomé
- Quelle est la capitale du Suriname ? → Paramaribo
- Quelle est la capitale de la Slovaquie ? → Bratislava
- Quelle est la capitale de la Slovénie ? → Ljubljana
- Quelle est la capitale de la Suède ? → Stockholm
- Quelle est la capitale de l'Eswatini ? → Mbabane
- Quelle est la capitale des Seychelles ? → Victoria
- Quelle est la capitale de la Syrie ? → Damas
- Quelle est la capitale du Tchad ? → N'Djaména
- Quelle est la capitale du Togo ? → Lomé
- Quelle est la capitale de la Thaïlande ? → Bangkok
- Quelle est la capitale du Tadjikistan ? → Douchanbé
- Quelle est la capitale du Turkménistan ? → Achgabat
- Quelle est la capitale du Timor oriental ? → Dili
- Quelle est la capitale des Tonga ? → Nukuʻalofa
- Quelle est la capitale de Trinité-et-Tobago ? → Port-d'Espagne
- Quelle est la capitale de la Tunisie ? → Tunis
- Quelle est la capitale de la Turquie ? → Ankara
- Quelle est la capitale de Tuvalu ? → Funafuti
- Quelle est la capitale de la Tanzanie ? → Dodoma
- Quelle est la capitale de l'Ouganda ? → Kampala
- Quelle est la capitale de l'Ukraine ? → Kiev
- Quelle est la capitale de l'Uruguay ? → Montevideo
- Quelle est la capitale des États-Unis ? → Washington
- Quelle est la capitale de l'Ouzbékistan ? → Tachkent
- Quelle est la capitale du Vatican ? → Vatican
- Quelle est la capitale de Saint-Vincent-et-les-Grenadines ? → Kingstown
- Quelle est la capitale du Venezuela ? → Caracas
- Quelle est la capitale du Vietnam ? → Hanoï
- Quelle est la capitale du Vanuatu ? → Port-Vila
- Quelle est la capitale des Samoa ? → Apia
- Quelle est la capitale du Yémen ? → Sanaa
- Quelle est la capitale de l'Afrique du Sud ? → Pretoria
- Quelle est la capitale de la Zambie ? → Lusaka
- Quelle est la capitale du Zimbabwe ? → Harare

</details>
