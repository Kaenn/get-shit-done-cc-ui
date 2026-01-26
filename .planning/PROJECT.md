# GSD-UI

## What This Is

A visual GSD (Get Shit Done) panel for Claude Code, built as a Tauri desktop app with React. The terminal remains central to the experience, with collapsible side panels providing project context, command shortcuts, and tree visualization of phases and plans.

## Core Value

Terminal-centric workflow enhancement — the GSD panel augments Claude Code without disrupting the terminal-first experience.

## Requirements

### Validated

- Terminal Claude Code fonctionnel avec streaming de messages — existing
- Systeme d'onglets avec persistence — existing
- Navigation tab-based (chat, agent, projects, settings) — existing
- Persistence des sessions (localStorage) — existing
- Support Tauri desktop + mode web — existing
- Composants UI Radix + Tailwind — existing
- State management Zustand + Context — existing
- Adapter pattern environnement (Tauri vs web) — existing
- Panneau lateral GSD a gauche ou droite du terminal — v1.0
- Panneau redimensionnable (drag pour ajuster largeur) — v1.0
- Panneau collapsible (toggle hide/show) — v1.0
- Parser STATE.md pour extraire l'etat courant — v1.0
- Parser ROADMAP.md pour extraire la structure — v1.0
- Parser les fichiers PLAN.md pour le detail — v1.0
- Detecter les changements de fichiers .planning/ — v1.0
- Afficher la hierarchie phases → plans en tree view — v1.0
- Expand/collapse des noeuds de l'arbre — v1.0
- Indicateurs de statut visuels (pending/in-progress/complete) — v1.0
- Barre de progression par phase — v1.0
- Boutons "Next Up" cliquables — v1.0
- Clic sur Next Up execute /clear puis commande — v1.0
- Commandes pre-promptees avec parametres — v1.0
- Systeme de combos (UI toggle, auto-chaining deferred) — v1.0
- Command panel avec categories et filtrage — v1.0
- Three-pane layout avec panneaux independants — v1.0
- Rebrand complet OPCode → GSD-UI — v1.0
- Conversation view collapsible avec tool badges — v1.0

### Active

- [ ] Systeme de plugins avec registration et configuration
- [ ] Abstraction des sources de donnees (fichiers / SQLite / custom)
- [ ] Multi-panneaux (plusieurs plugins ouverts simultanement)
- [ ] Settings UI dynamique pour configurer plugins/combos
- [ ] Keyboard shortcuts pour actions frequentes
- [ ] Auto-chaining combo execution via Rust backend events

### Out of Scope

- Plugin marketplace — Infrastructure massive, pas necessaire pour valider l'architecture
- Hot reload plugins — Complexite excessive, restart suffisant
- Plugin sandboxing — Trust model pour v1, securite peut attendre
- Multi-language plugins — TypeScript only simplifie le developpement
- Edition des fichiers .planning/ — Lecture seule, Claude Code gere l'ecriture
- Real-time collaboration — Single user pour v1
- Mobile — Desktop/web uniquement
- Authentification — Pas de systeme auth pour v1

## Context

Fork du projet OPCode (https://github.com/anthropics/claude-code). L'architecture existante est propre : terminal-centric, tab-based, avec separation claire des layers (presentation, business logic, services, API adapter).

**Current State (v1.0 shipped):**
- ~42,750 LOC TypeScript/TSX
- Tech stack: Tauri + React + TypeScript + Tailwind + Zustand + Radix UI
- 6 phases completed, 18 plans executed
- Cyan color scheme with GSD-UI branding
- OPCode attribution preserved

**User feedback themes:** None yet (first release)

**Known issues:**
- Combo toggle is UI-only; auto-chaining needs Rust backend events
- Some hardcoded paths in file reading commands

## Constraints

- **Tech stack**: Conserver Tauri + React + TypeScript + Tailwind + Zustand (stack existante)
- **Architecture**: Le terminal reste au centre, panneaux lateraux en complement
- **Plugin isolation**: Un plugin ne peut pas affecter le comportement d'un autre (future)
- **Data sources**: Abstraction obligatoire (pas de code specifique au filesystem dans le core) (future)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Terminal-centric | OPCode fonctionne bien, garder l'UX existante | Good |
| GSD comme premier plugin | Cas d'usage concret pour valider l'architecture | Good |
| Polling for file watching | Simpler than native fs-watch, no Rust changes | Good |
| Rust backend commands for file access | Avoids Tauri fs plugin sandbox restrictions | Good |
| 2-level hierarchy (phases → plans) | Matches ROADMAP.md structure | Good |
| Set<string> for expand state | O(1) lookup for tree nodes | Good |
| Three-pane layout | Flexible panel arrangement | Good |
| oklch(0.70 0.15 200) cyan | Modern color space, distinct from OPCode violet | Good |
| WhatsApp-style messages | Familiar UX, clear sender distinction | Good |
| Plugin config externe | Separation core/plugins, maintenabilite | Pending |
| Combos defined by plugin | Flexibilite, chaque plugin connait ses workflows | Pending |

---
*Last updated: 2026-01-25 after v1.0 milestone*
