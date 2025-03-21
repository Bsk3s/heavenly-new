export { default as BibleHeader } from './BibleHeader';
export { default as AudioPlayer } from './AudioPlayer';
export { default as FloatingNavigation } from './FloatingNavigation';

// Add a default export that includes all components
import BibleHeader from './BibleHeader';
import AudioPlayer from './AudioPlayer';
import FloatingNavigation from './FloatingNavigation';

export default {
  BibleHeader,
  AudioPlayer,
  FloatingNavigation
}; 