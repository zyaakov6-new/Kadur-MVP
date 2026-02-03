# KADUR (כדור) ⚽

The absolute best football pickup game app in the world.

## Setup

1.  **Install Dependencies**
    ```bash
    npm install
    ```

2.  **Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
    ```

3.  **Supabase Setup**
    - Create a new Supabase project.
    - Go to the SQL Editor and run the contents of `supabase/schema.sql`.
    - Enable Auth providers (Phone).

4.  **Run the App**
    ```bash
    npx expo start
    ```

## Tech Stack
- React Native (Expo)
- Supabase (Auth, DB, Realtime)
- NativeWind (Tailwind CSS)
- React Native Maps

## Features
- Map-based game discovery
- Realtime chat
- Player profiles & stats
- MVP voting
