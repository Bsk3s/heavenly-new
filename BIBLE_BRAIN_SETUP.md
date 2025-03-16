# Bible Brain API Integration Setup

This document provides instructions for setting up the Bible Brain API integration for the Bible app.

## Getting a Bible Brain API Key

1. Visit the [Bible Brain Developer Portal](https://www.faithcomesbyhearing.com/audio-bible-resources/bible-brain)
2. Click on "Get API Key" or "Sign Up" to create an account
3. Complete the registration process
4. Once registered, you'll be provided with an API key

## Configuring the App

1. Open the `.env` file in the root of the project
2. Replace `your_bible_brain_api_key_here` with your actual Bible Brain API key:
   ```
   BIBLE_BRAIN_API_KEY=your_actual_key_here
   ```

## Available Endpoints

The Bible Brain API provides several endpoints that we're using:

- `/bibles` - Get available Bible versions
- `/bibles/{bibleId}/books` - Get books for a specific Bible version
- `/bibles/{bibleId}/chapters/{bookId}.{chapterId}` - Get chapter text
- `/audio/path` - Get audio file URL for a chapter
- `/audio/versestart` - Get verse timing data for synchronized highlighting

## Testing the Integration

After setting up your API key:

1. Run the app with `npx expo start`
2. Navigate to the Bible tab
3. The app should automatically load available Bible versions with audio
4. Select a chapter and test the audio playback

## Troubleshooting

If you encounter issues:

1. Verify your API key is correct in the `.env` file
2. Check your internet connection
3. Ensure you have the latest version of the app
4. Look for error messages in the console logs

## API Documentation

For more information about the Bible Brain API, visit:
[Bible Brain API Documentation](https://4.dbt.io/api/swagger)
