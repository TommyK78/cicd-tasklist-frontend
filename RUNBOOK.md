# Runbook — Le frontend TaskList n'affiche aucune tâche

## 1. Sujet

Incident : **« Le frontend TaskList n'affiche aucune tâche »**. En production, l'utilisateur
ouvre l'application web (React servie par Nginx) mais, au lieu de voir sa liste de tâches, un
message d'erreur s'affiche. Le frontend n'arrive pas à récupérer les données auprès de l'API
backend (`GET /api/tasks`). Ce runbook couvre le diagnostic complet de la panne — qui traverse
toute la chaîne **navigateur → Nginx → API → base de données MySQL** — ainsi que sa résolution
selon la cause identifiée.

## 2. Problème de prod traité

Incident **bloquant** rendant l'application totalement inutilisable. Architecture conteneurisée :
le frontend (React + **Nginx**) et le backend (**Node/Express/Prisma**) tournent dans des
conteneurs Docker séparés et communiquent en réseau.

Causes possibles, de la plus fréquente à la moins fréquente :
1. Le conteneur **backend** est arrêté ou a planté.
2. **Nginx** ne route pas `/api` vers le backend (bloc `proxy_pass` absent de `nginx.conf`).
3. La **base de données MySQL** est injoignable → le backend répond en erreur 500.
4. Mauvaise URL d'API (`VITE_API_URL`) fournie au moment du build du frontend.

## 3. Symptômes

- Bloc d'erreur rouge (⚠️ « **Erreur : …** ») à la place de la liste des tâches.
- Aucune tâche ne se charge, compteur vide, même après rechargement.
- Console navigateur (**F12 → Network**) : `GET /api/tasks` en rouge, code **502 / 504 / 404**
  ou erreur « **Failed to fetch** ».
- Problème **généralisé** (tous les utilisateurs), le frontend se charge mais pas les données.

## 4. Qui doit l'utiliser

L'équipe d'exploitation : **développeur de garde (on-call), ops/DevOps, support niveau 1-2**.
Toute personne ayant accès aux **conteneurs Docker** et à leurs **logs** (`docker ps`,
`docker logs`, `docker exec`). Aucune expertise approfondie du code n'est requise.

## 5. Quand l'appliquer

**Immédiatement (priorité haute / incident bloquant).** Déclencheurs : signalement utilisateur
« je ne vois plus mes tâches », ou alerte de monitoring sur `/api/tasks` (code HTTP ≠ 200).

## 6. Quand NE PAS l'appliquer

- Problème **isolé à un seul poste** (réseau/cache de l'utilisateur) : confirmer d'abord que la
  panne est généralisée.
- Pendant une **maintenance/déploiement planifié** connu (indisponibilité attendue).
- En cas de **corruption de données** suspectée : ce runbook ne couvre que l'indisponibilité →
  basculer sur la procédure de restauration/sauvegarde.
- Si le symptôme est **différent** (tâches affichées mais non sauvegardées, erreur à la création
  uniquement, etc.).

## 7. Étapes à suivre

### A. Diagnostic — identifier la cause
1. **Reproduire** : ouvrir l'app, `F12` → Network, recharger, noter le code HTTP de
   `GET /api/tasks`.
2. **Vérifier le backend** : `docker ps` → conteneur `tasklist-backend` présent et `Up` ?
   S'il est `Exited` → cause trouvée (B1).
3. **Logs backend** : `docker logs tasklist-backend --tail 50` → crash ou
   « Can't reach database server » ?
4. **Tester l'API en direct** : `curl http://localhost:3001/api/tasks`.
   - `200` + JSON → backend OK, souci entre Nginx et l'API (B2).
   - Échec / `500` → problème backend ou base (B1/B3).
5. **Vérifier le proxy Nginx** :
   `docker exec tasklist-frontend cat /etc/nginx/conf.d/default.conf` → présence d'un bloc
   `location /api { proxy_pass ... }` ? Sinon les requêtes `/api` ne sont pas transmises.
6. **Vérifier la base** : `docker ps` → le conteneur MySQL tourne-t-il ?

### B. Résolution — selon la cause
- **B1 — Backend arrêté** : `docker start tasklist-backend` (ou redéployer l'image).
- **B2 — Nginx sans proxy `/api`** : ajouter dans `nginx.conf`
  `location /api/ { proxy_pass http://tasklist-backend:3001; }`, puis reconstruire et
  redéployer l'image frontend.
- **B3 — Base injoignable** : redémarrer le conteneur MySQL et/ou corriger `DATABASE_URL`.

### C. Vérification — retour à la normale
1. `curl http://localhost:3001/api/tasks` renvoie `200` + la liste.
2. Recharger la page web : les tâches s'affichent, plus de bloc d'erreur.
3. Plus aucune erreur réseau dans la console (F12).

### D. Prévention
- **Healthchecks** Docker sur le backend et la base.
- **Monitoring** de `/api/tasks` (alerte si code ≠ 200).
- **Test du proxy Nginx** dans la pipeline CI/CD avant chaque déploiement.
