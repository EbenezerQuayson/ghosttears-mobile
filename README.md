# GHOSTTEARS: Mobile

A strategic, mobile-first multiplayer word game based on bluffing and survival. This is a digital evolution of the traditional parlor game "Ghost".

## 👁️ Overview

Players take turns adding a single letter to a growing fragment. 
- If a player completes a valid word, they lose a life.
- If they add a letter that cannot form a word, they are bluffing and can be challenged.

The game features a haunting, deep dark mode aesthetic with high-tension gameplay.

## 🚀 Features

- **Strategic Word Gameplay**: Bluff and challenge opponents.
- **Multiplayer Mode**: Play with others online (powered by Supabase).
- **Single Player Mode**: Practice against an AI opponent.
- **Haunting Aesthetics**: Deep blacks, slate grays, and harsh red accents.
- **Trie-Based Word Engine**: Fast and efficient word validation.

## 🛠️ Tech Stack

- **Framework**: React Native (Expo Managed Workflow)
- **Navigation**: React Navigation (`@react-navigation/native`)
- **Backend**: Supabase (`@supabase/supabase-js`)
- **UI Feedback**: React Native Toast Message

## 📁 Project Structure

```text
ghosttears-mobile/
├── assets/             # App icons and splash screens
├── src/
│   ├── assets/        # Dictionary JSON, fonts, etc.
│   ├── components/    # Reusable UI elements
│   ├── engine/        # Core game logic (WordEngine, MultiplayerEngine, SupabaseClient)
│   └── screens/       # App screens (HomeScreen, SetupScreen, LobbyScreen, GameScreen)
├── App.js             # Main application entry and navigation
├── app.json           # Expo configuration
├── architecture.md    # Detailed project architecture and roadmap
└── supabase_schema.sql # Database schema for Supabase
```

## ⚙️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd ghosttears-mobile
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Database Setup**:
   Use the `supabase_schema.sql` file to set up your database tables in Supabase.

5. **Start the development server**:
   ```bash
   npm start
   ```
   or
   ```bash
   npx expo start
   ```

## 🗺️ Roadmap

- [x] Phase 1: Single Player Core Engine (Trie Word Engine)
- [x] Phase 2: Online Multiplayer (Supabase)
- [ ] Phase 3: Offline Peer-to-Peer Play (Local Hotspot via `react-native-tcp-socket`)


