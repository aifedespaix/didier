
# AGENTS.md

> Guide opérationnel pour les agents IA de code intervenant sur ce dépôt.  
> Objectif : produire du code **immédiatement intégrable**, **typé**, **maintenable**, et **performant**.

---

## 0) TL;DR (pour l’agent)

- Stack : **Nuxt 4 + Vite + TypeScript strict + UnoCSS + Pinia + VitePWA + Three.js**.
- Jeu 3D en **ECS léger** (World/Entity/Component/System). État du monde ≠ état UI (Pinia).
- Multijoueur **P2P WebRTC** sans serveur applicatif : **signalisation manuelle** (copier/coller Offer/Answer, option QR) et **STUN publics**. Pas de TURN par défaut.
- Réseau en **lockstep** (échange **inputs**, pas états), **RNG seed partagé**, **sync d’horloge**, **reconciliation**.
- Sortie attendue : **Résumé → Arborescence → Fichiers COMPLETS → Étapes d’intégration → Tests (si pertinents) → Notes**.
- **NE PAS** ajouter de dépendances non listées. **NE PAS** toucher `server/` pour de la logique métier.

[...]  # Le reste du contenu complet de l'AGENTS.md
