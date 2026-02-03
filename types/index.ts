export type Profile = {
    id: string;
    phone: string;
    full_name: string;
    avatar_url: string | null;
    city: string;
    favorite_position: string | null;
    stats: {
        games_played: number;
        goals: number;
        assists: number;
        mvps: number;
    };
};

export type Game = {
    id: string;
    organizer_id: string;
    title: string;
    description: string | null;
    location: any; // Using any for flexible PostGIS/Object handling
    address: string | null;
    start_time: string;
    format: '5v5' | '7v7' | '11v11' | 'custom';
    max_players: number;
    current_players: number;
    price: number | null;
    status: 'open' | 'full' | 'cancelled' | 'finished';
    image_url: string | null;
    created_at: string;
};

