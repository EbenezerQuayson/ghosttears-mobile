# Project Name: GHOSTTEARS: Mobile

## 1. Project Overview
"GHOSTTEARS: Mobile" is a strategic, mobile-first multiplayer word game based on bluffing and survival (a digital evolution of the traditional parlor game "Ghost"). Players take turns adding a single letter to a growing fragment. If a player completes a valid word, they lose a life. If they add a letter that cannot form a word, they are bluffing and can be challenged. 

## 2. Tech Stack & Environment
- **Framework:** React Native (Expo - Managed Workflow)
- **State Management:** TanStack Query (React Query)
- **UI/Styling:** StyleSheet / Custom Dark Mode aesthetics
- **Future Backend (Phase 2):** Supabase (PostgreSQL, Real-time channels)
- **Future Networking (Phase 3):** `react-native-tcp-socket` and ZeroConf for offline mobile hotspot play (peer-to-peer).

## 3. Current State
- The Expo project has been initialized using the blank template.
- The project is version-controlled via Git.
- `App.js` currently renders a dark-mode placeholder screen showing "GHOSTTEARS" and "Mobile" in white and red text.

## 4. Immediate Task: Phase 1 (Single Player Core Engine)
Your objective as the agent is to establish the core game logic and file structure. Do not implement any networking or multiplayer features yet.

**Step 1: Scalable Folder Structure**
Create a modular `src` directory with the following structure:
- `src/engine/` (For the game logic and Trie data structure)
- `src/components/` (For reusable UI elements, like the game board and custom keyboard)
- `src/screens/` (For main views)
- `src/assets/` (For the dictionary JSON, fonts, etc.)

**Step 2: The Word Engine (Trie)**
- Create a `Trie` class in `src/engine/WordEngine.js`.
- Implement an `insert(word)` method to populate the tree.
- Implement a `checkStatus(fragment)` method that returns one of three states: `'VALID_PREFIX'`, `'COMPLETE_WORD'`, or `'INVALID'` (a bluff).
- Find a standard English dictionary list (like SOWPODS or Scrabble), convert it to a lightweight JSON file in `src/assets/`, and write the logic to load this into the Trie upon app initialization.

**Step 3: Basic Game State Loop**
- Define a strict state object that tracks:
  - `currentFragment` (String, e.g., "GHO")
  - `playerTurn` (Enum/String)
  - `playerLives` (Object tracking remaining lives)
  - `gameState` ('playing', 'challenged', 'game_over')
- Build a basic AI opponent (a "Novice" bot) that randomly selects a valid next letter based on the current prefix in the Trie.

## 5. UI/UX Rules
- **Theme:** Haunting, deep dark mode by default. Use deep blacks (`#0a0a0a`), slate grays, and harsh red (`#ff3333`) accents for negative actions (like losing a life or getting challenged).
- **Vibe:** Glitchy, authoritative, high-tension. Avoid rounded, playful aesthetics; lean into a sharp, brutalist mobile design.