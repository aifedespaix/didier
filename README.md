# Didier — Online Miami

## Concept

*Online Miami* est un shooter frénétique en vue de dessus. Chaque joueur déplace son personnage dans un décor néon vu du ciel. Le clic gauche déclenche le tir de l'arme active, tandis que le clic droit allume ou éteint une torche pour éclairer les zones sombres. Le jeu fonctionne en multijoueur **pair-à-pair** : les joueurs se connectent directement entre eux sans serveur central.

## Commandes

| Entrée                        | Action                |
|------------------------------|-----------------------|
| WASD / ZQSD ou flèches       | Déplacer le personnage|
| Clic gauche                  | Tirer                 |
| Clic droit                   | Activer la torche     |

Un détecteur de disposition de clavier adapte automatiquement les touches de déplacement (WASD pour QWERTY, ZQSD pour AZERTY).

## Multijoueur et rôle du host

Le réseau repose sur WebRTC. Un joueur agit en tant que **host**. Il crée la salle, accepte les connexions et diffuse l'état autoritaire du jeu. La synchronisation des positions et actions se fait sur un pas de temps fixe afin de garder tous les pairs alignés.

### Prérequis techniques
- Navigateur moderne compatible WebRTC
- Connexion stable (l'ouverture de ports ou l'usage de STUN/TURN peut être nécessaire pour certains hôtes)

## Développement

### Prérequis
- [Node.js](https://nodejs.org/) ou [Bun](https://bun.sh/)
- Git et un navigateur récent

Installer les dépendances :
```bash
bun install
```

### Lancer le serveur de jeu
Un serveur local s'exécute sur [http://localhost:3000](http://localhost:3000) :
```bash
bun dev
```

### Construire pour la production
```bash
bun run build
```
