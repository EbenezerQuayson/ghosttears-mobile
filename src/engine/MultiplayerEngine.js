import { supabase } from './SupabaseClient';

export default class MultiplayerEngine {
    constructor(roomCode, playerId, onUpdate) {
        this.roomCode = roomCode;
        this.playerId = playerId; // 'host' or 'guest'
        this.onUpdate = onUpdate; // Callback to GameScreen whenever room row updates
        this.channel = null;
    }

    static generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let code = '';
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    static async createRoom(gameSettings) {
        const code = this.generateRoomCode();

        // In this MVP we just create a row anonymously
        const { data, error } = await supabase
            .from('rooms')
            .insert([{
                room_code: code,
                host_id: 'host_anon',
                locked_words: { animals: [], countries: [], fruits: [], vegetables: [] },
                game_settings: gameSettings
            }])
            .select()
            .single();

        if (error) {
            console.error('Error creating room:', error);
            return null;
        }
        return data;
    }

    static async joinRoom(code) {
        // Check if room exists and is waiting
        const { data, error } = await supabase
            .from('rooms')
            .select('*')
            .eq('room_code', code.toUpperCase())
            .single();

        if (error || !data) {
            console.error('Room not found or error:', error);
            return null;
        }

        if (data.status !== 'waiting') {
            console.error('Room is not waiting for players.');
            return null;
        }

        // Update room to playing and set initial turn to host
        const { data: updatedRoom, error: updateError } = await supabase
            .from('rooms')
            .update({ status: 'playing', guest_id: 'guest_anon', player_turn: 'host' })
            .eq('id', data.id)
            .select()
            .single();

        if (updateError) {
            console.error('Error joining room:', updateError);
            return null;
        }

        return updatedRoom;
    }

    subscribe() {
        this.channel = supabase
            .channel(`room_${this.roomCode}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'rooms',
                    filter: `room_code=eq.${this.roomCode}`,
                },
                (payload) => {
                    if (this.onUpdate) {
                        this.onUpdate(payload.new);
                    }
                }
            )
            .subscribe();
    }

    unsubscribe() {
        if (this.channel) {
            supabase.removeChannel(this.channel);
        }
    }

    async sendCategorySelect(category, turnTimer = 30) {
        const { error } = await supabase
            .from('rooms')
            .update({
                active_category: category,
                turn_ends_at: Date.now() + (turnTimer * 1000)
            })
            .eq('room_code', this.roomCode);

        if (error) {
            console.error('Error sending category:', error);
        }
    }

    async sendMove(fragment, category, nextTurn, turnTimer = 30) {
        const { error } = await supabase
            .from('rooms')
            .update({
                current_fragment: fragment,
                active_category: category,
                player_turn: nextTurn,
                turn_ends_at: Date.now() + (turnTimer * 1000)
            })
            .eq('room_code', this.roomCode);

        if (error) {
            console.error('Error sending move:', error);
        }
    }

    async sendPenalty(hostPenalty, guestPenalty, nextTurn, lockedWordsObj = null) {
        const updates = {
            host_penalty: hostPenalty,
            guest_penalty: guestPenalty,
            player_turn: nextTurn,
            active_category: null,
            turn_ends_at: null // Resets the timer until new category is selected
        };

        if (lockedWordsObj) {
            updates.locked_words = lockedWordsObj;
        }

        if (hostPenalty >= 10 || guestPenalty >= 10) {
            updates.status = 'finished';
        } else {
            updates.current_fragment = '';
        }

        const { error } = await supabase
            .from('rooms')
            .update(updates)
            .eq('room_code', this.roomCode);

        if (error) {
            console.error('Error sending penalty:', error);
        }
    }

    async sendPauseToggle(isPaused, timeRemaining) {
        const updates = { is_paused: isPaused };
        if (!isPaused && timeRemaining !== undefined && timeRemaining !== null) {
            updates.turn_ends_at = Date.now() + timeRemaining;
        }

        const { error } = await supabase
            .from('rooms')
            .update(updates)
            .eq('room_code', this.roomCode);

        if (error) {
            console.error('Error sending pause toggle:', error);
        }
    }

    async sendEvent(title, message, type = 'info') {
        const { error } = await supabase
            .from('rooms')
            .update({
                latest_event: { title, message, type, timestamp: Date.now() }
            })
            .eq('room_code', this.roomCode);

        if (error) {
            console.error('Error sending event:', error);
        }
    }
}
