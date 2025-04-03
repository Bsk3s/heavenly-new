export { default as BibleHeader } from './BibleHeader';
export { default as AudioPlayer } from './AudioPlayer';
export { default as FloatingNavigation } from './FloatingNavigation';

// Default export for the module
const BibleComponents = {
  BibleHeader: require('./BibleHeader').default,
  AudioPlayer: require('./AudioPlayer').default,
  FloatingNavigation: require('./FloatingNavigation').default
};

export default BibleComponents; 