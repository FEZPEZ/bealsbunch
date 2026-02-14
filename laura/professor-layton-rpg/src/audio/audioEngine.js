import tracksData from './tracks.json';

export class AudioEngine {
    constructor(eventBus) {
        this.eventBus = eventBus;
        this.tracks = {};
        this.currentMusic = null;
        this.currentTrackId = null;
        this.masterVolume = 0.5;
        this.sfxVolume = 1.0;
        this.initialized = false;
        this.audioContext = null;
        this.gainNode = null;
        this.scheduledStop = false;
    }

    async init() {
        if (this.initialized) return;

        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.gainNode = this.audioContext.createGain();
        this.gainNode.connect(this.audioContext.destination);
        this.gainNode.gain.value = this.masterVolume;

        for (const [id, data] of Object.entries(tracksData)) {
            this.tracks[id] = {
                ...data,
                buffer: null,
                loaded: false
            };
        }

        this.initialized = true;
        console.log('🔊 Audio engine initialized');
    }

    async loadTrack(trackId) {
        if (!this.tracks[trackId]) {
            console.warn(`Track not found: ${trackId}`);
            return null;
        }

        const track = this.tracks[trackId];

        if (track.loaded && track.buffer) {
            return track.buffer;
        }

        try {
            const response = await fetch(`/src/audio/${track.file}`);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

            track.buffer = audioBuffer;
            track.loaded = true;

            return audioBuffer;
        } catch (error) {
            console.error(`Error loading track ${trackId}:`, error);
            return null;
        }
    }

    async playMusic(trackId, forceRestart = false) {
        if (!this.initialized) {
            console.warn('Audio engine not initialized');
            return;
        }

        // Don't restart if it's the same track
        if (this.currentTrackId === trackId && !forceRestart) {
            console.log(`Music ${trackId} already playing`);
            return;
        }

        console.log(`Playing music: ${trackId}`);

        // Stop current music completely
        this.stopMusic();

        const buffer = await this.loadTrack(trackId);

        if (!buffer) return;

        const track = this.tracks[trackId];
        const trackVolume = track.volume || 1.0;
        this.currentTrackId = trackId;
        this.scheduledStop = false;

        // Handle intro/loop tracks
        if (track.type === 'music_intro' && track.next) {
            const loopBuffer = await this.loadTrack(track.next);

            if (loopBuffer) {
                // Play intro
                const introSource = this.audioContext.createBufferSource();
                introSource.buffer = buffer;

                const introGain = this.audioContext.createGain();
                introGain.gain.value = trackVolume;
                introGain.connect(this.gainNode);
                introSource.connect(introGain);

                const introDuration = buffer.duration;
                const startTime = this.audioContext.currentTime;

                introSource.start(0);
                this.currentMusic = {
                    source: introSource,
                    gain: introGain,
                    stop: () => {
                        try { introSource.stop(); } catch(e) {}
                    }
                };

                // Schedule loop to start exactly when intro ends
                const loopSource = this.audioContext.createBufferSource();
                loopSource.buffer = loopBuffer;
                loopSource.loop = true;

                const loopGain = this.audioContext.createGain();
                loopGain.gain.value = this.tracks[track.next].volume || trackVolume;
                loopGain.connect(this.gainNode);
                loopSource.connect(loopGain);

                loopSource.start(startTime + introDuration);

                // Update reference when intro ends
                setTimeout(() => {
                    if (!this.scheduledStop && this.currentTrackId === trackId) {
                        this.currentMusic = {
                            source: loopSource,
                            gain: loopGain,
                            stop: () => {
                                try { loopSource.stop(); } catch(e) {}
                            }
                        };
                        this.currentTrackId = track.next;
                    }
                }, introDuration * 1000);
            }
        } else {
            // Play single track
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.loop = track.loop || false;

            const gainNode = this.audioContext.createGain();
            gainNode.gain.value = trackVolume;
            gainNode.connect(this.gainNode);
            source.connect(gainNode);

            source.start(0);
            this.currentMusic = {
                source,
                gain: gainNode,
                stop: () => {
                    try { source.stop(); } catch(e) {}
                }
            };
        }
    }

    async playSfx(trackId) {
        if (!this.initialized) return;

        const buffer = await this.loadTrack(trackId);

        if (!buffer) return;

        const track = this.tracks[trackId];
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;

        const sfxGain = this.audioContext.createGain();
        sfxGain.gain.value = this.sfxVolume * (track.volume || 1.0);
        sfxGain.connect(this.audioContext.destination);

        source.connect(sfxGain);
        source.start(0);
    }

    stopMusic() {
        this.scheduledStop = true;
        this.currentTrackId = null;

        if (this.currentMusic && this.currentMusic.stop) {
            try {
                this.currentMusic.stop();
            } catch (e) {
                // Already stopped
            }
            this.currentMusic = null;
        }
    }

    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.gainNode) {
            this.gainNode.gain.value = this.masterVolume;
        }
    }

    async preloadTrack(trackId) {
        await this.loadTrack(trackId);

        // Also preload loop tracks
        const track = this.tracks[trackId];
        if (track && track.type === 'music_intro' && track.next) {
            await this.loadTrack(track.next);
        }
    }
}