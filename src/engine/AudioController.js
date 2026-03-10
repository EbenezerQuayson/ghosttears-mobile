import { Audio } from 'expo-av';

class AudioController {
    constructor() {
        this.sounds = {};
    }

    async preloadSounds() {
        // Prepare references for future audio files
        // e.g. this.sounds.keystroke = await Audio.Sound.createAsync(require('../assets/audio/keystroke.mp3'));
    }

    async playKeystroke() {
        if (this.sounds.keystroke) {
            await this.sounds.keystroke.sound.replayAsync();
        }
    }

    async playPenalty() {
        if (this.sounds.penalty) {
            await this.sounds.penalty.sound.replayAsync();
        }
    }

    async playSuccess() {
        if (this.sounds.success) {
            await this.sounds.success.sound.replayAsync();
        }
    }
}

export default new AudioController();
