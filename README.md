# ConceptConstructif

Outil de chiffrage BTP — dessin 2D interactif, visualisation 3D et estimation automatique des coûts de construction.

## Principe

L'utilisateur importe un plan (image), trace des éléments sur le canvas (murs, dalles, toitures), et l'application calcule automatiquement les quantités de matériaux et leurs coûts à partir d'une bibliothèque d'**Ouvrages** configurables.

Un système de **Zones** permet de comparer plusieurs variantes (ex : « Option brique » vs « Option parpaing ») sur le même plan, sans ressaisir les tracés.

## Fonctionnement

```
Plan importé → Échelle calibrée → Tracés dessinés → Couleur assignée à un Ouvrage
                                                           ↓
                                               Quantités calculées automatiquement
                                               (L / H / E / S / V + cascade Cn)
                                                           ↓
                                               Tableau de chiffrage + impression PDF
```

## Caractéristiques

- **100 % offline, zéro installation** — `dist/index.html` s'ouvre en double-clic, aucun serveur requis, compatible Firefox et Chrome
- **Dessin 2D interactif** — Konva.js : trait d'échelle, polylignes (murs), polygones (sols, toitures)
- **Épaisseur visuelle des traits** — `strokeWidth = E / scale.ratio`, mise à jour instantanée quand E change
- **Vue 3D** — Three.js + OrbitControls, panneau flottant draggable/resizable
- **Formules configurables** — mathjs : `L * H / 0.25`, `ceil(C1 * 0.35)`, cascade `C1`, `C2`…
- **Angle de pente** — surface inclinée : `S_réelle = S_projetée / cos(angle)`, répercuté en 3D
- **Undo/redo** — Ctrl+Z / Ctrl+Y, pile de 20 snapshots
- **Export/import JSON** — sauvegarde et partage du projet complet
- **Impression / PDF** — `window.print()`, mise en page configurable (2D, 3D, récaps, liste)

## Démarrage

```bash
npm install
npm run dev       # Serveur de développement
npm test          # 33 tests unitaires (Vitest)
npm run build     # Produit dist/index.html (fichier unique, tout inline)
```

Le fichier `dist/index.html` peut être ouvert directement par double-clic dans n'importe quel navigateur — tout le JS et le CSS sont inline dans l'HTML.

## Stack technique

| Couche | Outil | Version |
|---|---|---|
| Build | Vite + `vite-plugin-singlefile` | 8.x |
| Langage | TypeScript strict | 6.x |
| UI | Vue 3 Composition API | 3.5.x |
| Canvas 2D | Konva.js | 10.x |
| Vue 3D | Three.js + OrbitControls | 0.185.x |
| Formules | mathjs | 15.x |
| Persistance | idb (IndexedDB) | 8.x |
| État global | Pinia | 3.x |
| Tests | Vitest | 4.x |

## Variables de formule

| Variable | Tracé ligne | Tracé surface | Description |
|---|---|---|---|
| `L` | ✓ | ✓ | Longueur totale (m) — surface : étendue X du polygone |
| `H` | ✓ | ✓ | Hauteur (m) — surface : étendue Y du polygone |
| `E` | ✓ | ✓ | Épaisseur (m), depuis l'assignation couleur |
| `S` | ✓ | ✓ | L×H (ligne) ou aire réelle corrigée par l'angle (surface) |
| `V` | ✓ | ✓ | S × E |
| `C1`, `C2`… | ✓ | ✓ | Quantité du constituant en position n (cascade) |

Fonctions disponibles : `sqrt`, `log`, `log10`, `abs`, `floor`, `ceil`, `round`, `min`, `max`, `pow`, `pi`, `e`.

**`formulaRecap`** (optionnelle) : appliquée au total agrégé sur tous les tracés de la zone. La variable `X` représente la somme brute. Exemple : `ceil(X)` pour arrondir au sac entier.

## Exemple de formule — Mur brique 1 brique

```
Ouvrage : Mur brique 1B  (E=0.105 m, H=2.5 m)

Pos 1 — Brique pleine   : L * H / (0.220 * 0.050)   → ~681 briques  pour L=3 m
Pos 2 — Ciment          : C1 * 0.0033                → ~2.25 sacs 25 kg
Pos 3 — Sable           : C1 * 0.013                 → ~9 sacs 35 kg
Pos 4 — Pose            : C1 / 90                    → ~7.5 heures

formulaRecap (Brique) : ceil(X)  → arrondi au supérieur sur le total de la zone
```

## Workflow type

1. Importer un plan (glisser-déposer une image sur le canvas)
2. Tracer le **trait d'échelle** (clic-clic) → saisir la longueur réelle → ratio calculé
3. Créer les **constituants** (matériaux) et les **ouvrages** (assemblages) dans la bibliothèque
4. Créer une **couleur** → lui assigner un Ouvrage + E + H
5. Tracer les **murs** (mode Trait) et les **surfaces** (mode Surface) dans cette couleur
6. Le **tableau de chiffrage** se met à jour en temps réel dans le panneau flottant
7. Dupliquer la Zone pour tester une variante, comparer les totaux
8. **Imprimer** (🖨) ou **exporter JSON** (📤)

## Structure du projet

```
src/
├── domain/                       # Logique métier pure — zéro dépendance UI
│   ├── models/                   # Interfaces TypeScript
│   │   ├── Scale.ts              # Échelle (ratio px→m, coordonnées du trait)
│   │   ├── Constituent.ts        # Matériau unitaire (prix, fournisseur, URL)
│   │   ├── Ouvrage.ts            # Ouvrage + OuvrageConstituent (formules)
│   │   ├── Trace.ts              # LineTrace, SurfaceTrace
│   │   ├── Zone.ts               # Zone + ColorAssignment
│   │   └── Project.ts            # Racine du modèle de données
│   ├── services/
│   │   ├── ScaleCalculator.ts    # px → mètres, ratio
│   │   ├── SurfaceCalculator.ts  # Aire shoelace + correction angle cos(θ)
│   │   ├── FormulaEvaluator.ts   # Évaluation mathjs sécurisée
│   │   ├── ChiffrageCalculator.ts# Calcul complet : variables → cascade → coûts
│   │   ├── ZoneDuplicator.ts     # Copie profonde (scale + tracés + assignations)
│   │   └── HistoryManager.ts     # Pile undo/redo par snapshot JSON
│   └── __tests__/                # 33 tests unitaires
│
├── canvas/                       # Konva.js
│   ├── CanvasManager.ts          # Stage + 5 layers (background/scale/traces/tool/numbers)
│   ├── ImageLoader.ts            # Fit 90 %, centré, dataURL → Konva.Image
│   ├── tools/
│   │   ├── ScaleTool.ts          # Clic-clic → trait d'échelle
│   │   ├── LineTool.ts           # Polyligne (double-clic pour terminer)
│   │   └── PolygonTool.ts        # Polygone fermé (snap 12 px au 1er point)
│   ├── renderers/
│   │   ├── ScaleRenderer.ts      # Double flèche ←[5,00 m]→ + label jaune
│   │   ├── TraceRenderer.ts      # Tracés colorés, strokeWidth = E/ratio
│   │   └── NumberRenderer.ts     # Numéro au centroïde, cercle couleur
│   └── interactions/
│       └── TraceTransformer.ts   # Sélection + copier/coller (Ctrl+C/V)
│
├── scene3d/
│   └── Scene3D.ts                # Three.js : BoxGeometry (murs), ShapeGeometry (surfaces)
│
├── storage/
│   ├── ProjectStore.ts           # CRUD IndexedDB via idb
│   └── JsonExporter.ts           # Export/import .json (validation à l'import)
│
├── stores/
│   └── projectStore.ts           # Pinia : état global, snapshot avant chaque mutation
│
├── print/
│   └── PrintConfig.ts            # Interface + valeurs par défaut
│
└── components/
    ├── App.vue                   # Layout racine, Ctrl+Z/Y, flux impression
    ├── AppHeader.vue             # Zone selector, undo/redo, save/import/export/print
    ├── SidebarLeft.vue
    │   ├── ToolsSection.vue      # Modes : Échelle / Trait / Surface / Sélection
    │   ├── ColorSection.vue      # ColorAssignments de la zone active
    │   └── ZoneSection.vue       # Zones : créer / dupliquer / supprimer
    ├── CanvasView.vue            # Orchestration Konva, drag-drop image
    ├── FloatingPanel.vue         # Overlay draggable + resizable (générique)
    ├── Scene3DFloat.vue          # Three.js dans un FloatingPanel
    ├── ChiffrageFloat.vue        # Tableau de chiffrage (3 onglets)
    ├── OuvrageLibraryModal.vue   # CRUD ouvrages + constituants + formules
    ├── PrintLayout.vue           # Layout masqué, visible uniquement @media print
    └── dialogs/
        ├── ScaleDialog.vue       # Saisie de la longueur réelle du trait
        ├── ColorAssignDialog.vue # Couleur → Ouvrage + E + H + angle par défaut
        └── PrintDialog.vue       # Configuration des sections avant impression
```

## Modèle de données

```
Project
├── constituents: Constituent[]      # Bibliothèque globale de matériaux
├── ouvrages: Ouvrage[]              # Bibliothèque globale d'ouvrages
│   └── constituents: OuvrageConstituent[]  # formule par position (cascade Cn)
└── zones: Zone[]                    # Variantes (Option A, Option B…)
    ├── scale: Scale                 # Ratio px→m + coordonnées du trait d'échelle
    ├── backgroundImage: string      # dataURL de l'image de fond
    ├── colorAssignments: ColorAssignment[]  # Couleur → Ouvrage + E/H/angle
    └── traces: Trace[]              # LineTrace | SurfaceTrace
        ├── colorAssignmentId        # UUID stable (résistant aux changements de couleur)
        ├── points: [number,number][]# Coordonnées pixel
        └── up: number               # Hauteur sol en mètres (positionnement 3D)
```

## Tests

```
src/domain/__tests__/
├── ScaleCalculator.test.ts      4 tests  — ratio, pixelsToMeters, tracePoints
├── SurfaceCalculator.test.ts    4 tests  — shoelace, correction cos(angle)
├── FormulaEvaluator.test.ts     6 tests  — variables L/H/E/S/V, cascade Cn, validation
├── ChiffrageCalculator.test.ts  5 tests  — ligne, surface, angle 30°, cascade
├── ZoneDuplicator.test.ts       4 tests  — copie profonde, indépendance des zones
├── HistoryManager.test.ts       6 tests  — push/undo/redo, canUndo/canRedo, limite 20
└── JsonExporter.test.ts         4 tests  — export round-trip, validation à l'import

Total : 33 tests — 7 fichiers
```
