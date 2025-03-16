# Bible Brain Integration Implementation Guide

This guide provides instructions for implementing the Bible Brain API integration in your Bible app, replacing the OpenAI TTS system with professional Bible audio.

## Overview

The Bible Brain integration provides:

- Professional audio narration of Bible text
- Synchronized verse highlighting during playback
- Multiple Bible versions with audio support
- Playback speed controls (0.75x, 1x, 1.25x, 1.5x, 2x)
- Verse-level navigation

## Implementation Steps

### 1. Setup Bible Brain API

1. Follow the instructions in `BIBLE_BRAIN_SETUP.md` to get your API key
2. Add the API key to your `.env` file

### 2. Core Services and Hooks

We've created the following files:

- `app/features/bible/services/bibleBrainService.js` - Core API service
- `app/features/bible/hooks/useBibleBrainContent.js` - Hook for Bible text content
- `app/features/bible/hooks/useBibleBrainAudio.js` - Hook for audio playback
- `app/features/bible/contexts/BibleBrainAudioContext.js` - Audio context provider
- `app/features/bible/hooks/useBibleBrain.js` - Combined hook for content and audio

### 3. UI Components

We've created the following components:

- `app/features/bible/components/BibleBrainVerseItem.js` - Verse display with highlighting
- `app/features/bible/components/BibleBrainVerseHighlighter.js` - Auto-scrolling during playback
- `app/features/bible/components/BibleBrainChapter.js` - Chapter display with verses
- `app/features/bible/components/BibleBrainAudioPlayer.js` - Audio player with controls
- `app/features/bible/components/AudioSpeedControls.js` - Playback speed controls
- `app/features/bible/components/BibleVersionSelector.js` - Bible version selection

### 4. Demo Screen

We've created a demo screen to showcase the integration:

- `app/features/bible/screens/BibleBrainDemo.js` - Demo screen
- `app/bible-brain-demo.js` - Route to the demo screen

## Integration with Existing App

To integrate with your existing Bible app:

1. **Replace Text Source**: Update your Bible content hooks to use `useBibleBrainContent` instead of your current text source.

2. **Replace Audio System**: Replace your OpenAI TTS system with the Bible Brain audio system:

   - Remove `openaiTTSService.js`, `TextToSpeech.js`, and other TTS-related files
   - Use `BibleBrainAudioContext` instead of your current `AudioContext`
   - Update your audio player components to use the Bible Brain audio player

3. **Update Bible Component**: Modify your main Bible component to use the Bible Brain hooks and components:

   ```jsx
   // Import the combined hook
   import useBibleBrain from "../hooks/useBibleBrain";

   // Use the hook in your component
   const {
     bibles,
     selectedBible,
     chapter,
     isPlaying,
     currentVerseIndex,
     play,
     pause,
     seekToVerse,
     // ... other properties and methods
   } = useBibleBrain(initialBibleId, initialBookId, initialChapterId);
   ```

4. **Add Verse Highlighting**: Update your verse rendering to highlight the current verse during playback:

   ```jsx
   <BibleBrainVerseItem
     verseNumber={verse.verseNumber}
     text={verse.text}
     isHighlighted={verse.verseNumber === currentVerse}
     isPlaying={isPlaying}
     onPress={handleVersePress}
   />
   ```

5. **Add Speed Controls**: Integrate the speed controls into your audio player:
   ```jsx
   <AudioSpeedControls currentSpeed={audioSpeed} onSpeedChange={setSpeed} />
   ```

## Testing

1. Run the demo screen to test the integration:

   ```
   npx expo start
   ```

2. Navigate to `/bible-brain-demo` in the app

3. Test the following features:
   - Bible version selection
   - Audio playback
   - Verse highlighting
   - Auto-scrolling
   - Playback speed controls
   - Verse navigation by tapping

## Troubleshooting

- **API Key Issues**: Ensure your Bible Brain API key is correctly set in the `.env` file
- **Audio Playback Issues**: Check your audio session setup in `BibleBrainAudioContext.js`
- **Verse Highlighting Issues**: Verify that your verse components are correctly passing refs to the highlighter

## Next Steps

After basic integration, consider these enhancements:

1. **Offline Support**: Implement caching of audio files for offline playback
2. **Continuous Playback**: Add support for playing multiple chapters in sequence
3. **Bookmarking**: Allow users to bookmark verses with audio position
4. **Sharing**: Enable sharing of verses with audio clips
5. **Advanced UI**: Enhance the UI with animations and transitions
