import { Audio } from 'expo-av';

class AudioService {
  constructor() {
    this.sound = null;
    this.statusCallback = null;
    this.isLoading = false;
    this.loadPromise = null;
    this.lastError = null;
    this.debugLog = [];
  }

  _log(action, details) {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      details,
      soundExists: !!this.sound,
      isLoading: this.isLoading
    };
    console.log('AudioService:', entry);
    this.debugLog.push(entry);
    if (this.debugLog.length > 100) this.debugLog.shift();
  }

  setStatusCallback(callback) {
    this._log('setStatusCallback', { hasCallback: !!callback });
    this.statusCallback = callback;
  }

  _onPlaybackStatusUpdate = (status) => {
    this._log('statusUpdate', {
      isLoaded: status?.isLoaded,
      isPlaying: status?.isPlaying,
      position: status?.positionMillis,
      duration: status?.durationMillis,
      didJustFinish: status?.didJustFinish
    });

    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  async unloadAudio() {
    this._log('unloadAudio', { starting: true });
    try {
      if (this.sound) {
        const status = await this.sound.getStatusAsync();
        this._log('unloadAudio', { preUnloadStatus: status });
        await this.sound.unloadAsync();
        this.sound = null;
        this._log('unloadAudio', { success: true });
      }
    } catch (error) {
      this.lastError = error;
      this._log('unloadAudio', { error: error.message });
      console.error('Error unloading audio:', error);
    }
  }

  async setupAudio(audioBuffer) {
    this._log('setupAudio', {
      hasBuffer: !!audioBuffer,
      bufferLength: audioBuffer?.length,
      isLoading: this.isLoading
    });

    if (this.isLoading) {
      this._log('setupAudio', { skipped: 'Already loading' });
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadPromise = (async () => {
      try {
        await this.unloadAudio();

        if (!audioBuffer) {
          throw new Error('No audio buffer provided');
        }

        this._log('setupAudio', { creating: true });
        const { sound } = await Audio.Sound.createAsync(
          { uri: `data:audio/mp3;base64,${audioBuffer}` },
          {
            shouldPlay: false,
            progressUpdateIntervalMillis: 100,
            positionMillis: 0,
            volume: 1.0,
            rate: 1.0,
            shouldCorrectPitch: true,
            playsInSilentModeIOS: true,
          },
          this._onPlaybackStatusUpdate
        );

        this.sound = sound;
        const status = await sound.getStatusAsync();
        this._log('setupAudio', {
          success: true,
          status
        });
        return true;
      } catch (error) {
        this.lastError = error;
        this._log('setupAudio', { error: error.message });
        console.error('Error setting up audio:', error);
        throw error;
      } finally {
        this.isLoading = false;
        this.loadPromise = null;
      }
    })();

    return this.loadPromise;
  }

  async play() {
    this._log('play', { starting: true });
    try {
      if (!this.sound) {
        throw new Error('No audio loaded');
      }

      const status = await this.sound.getStatusAsync();
      this._log('play', { prePlayStatus: status });

      if (!status.isLoaded) {
        throw new Error('Audio not loaded');
      }

      await this.sound.playAsync();
      const newStatus = await this.sound.getStatusAsync();
      this._log('play', {
        success: true,
        postPlayStatus: newStatus
      });
      return true;
    } catch (error) {
      this.lastError = error;
      this._log('play', { error: error.message });
      console.error('Error playing audio:', error);
      throw error;
    }
  }

  async pause() {
    this._log('pause', { starting: true });
    try {
      if (!this.sound) {
        this._log('pause', { skipped: 'No sound object' });
        return false;
      }

      const status = await this.sound.getStatusAsync();
      this._log('pause', { prePauseStatus: status });

      if (!status.isLoaded) {
        this._log('pause', { skipped: 'Not loaded' });
        return false;
      }

      await this.sound.pauseAsync();
      const newStatus = await this.sound.getStatusAsync();
      this._log('pause', {
        success: true,
        postPauseStatus: newStatus
      });
      return true;
    } catch (error) {
      this.lastError = error;
      this._log('pause', { error: error.message });
      console.error('Error pausing audio:', error);
      throw error;
    }
  }

  async stop() {
    this._log('stop', { starting: true });
    try {
      if (!this.sound) {
        this._log('stop', { skipped: 'No sound object' });
        return false;
      }

      const status = await this.sound.getStatusAsync();
      this._log('stop', { preStopStatus: status });

      if (!status.isLoaded) {
        this._log('stop', { skipped: 'Not loaded' });
        return false;
      }

      await this.sound.stopAsync();
      await this.unloadAudio();
      this._log('stop', { success: true });
      return true;
    } catch (error) {
      this.lastError = error;
      this._log('stop', { error: error.message });
      console.error('Error stopping audio:', error);
      throw error;
    }
  }

  getDebugInfo() {
    return {
      lastError: this.lastError?.message,
      lastErrorStack: this.lastError?.stack,
      recentLogs: this.debugLog.slice(-20),
      currentState: {
        hasSound: !!this.sound,
        isLoading: this.isLoading,
        hasCallback: !!this.statusCallback
      }
    };
  }

  async getStatus() {
    try {
      if (!this.sound) return null;
      const status = await this.sound.getStatusAsync();
      this._log('getStatus', { status });
      return status;
    } catch (error) {
      this.lastError = error;
      this._log('getStatus', { error: error.message });
      console.error('Error getting status:', error);
      return null;
    }
  }
}

// Create and export a singleton instance
const audioService = new AudioService();
export default audioService; 