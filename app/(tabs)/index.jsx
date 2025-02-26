import React, { useState } from 'react';
import { View } from 'react-native';

// Import components
import PageWrapper from '../components/layout/PageWrapper';
import DailyVerse from '../components/home/DailyVerse';
import DailyProgressRow from '../components/home/DailyProgressRow';
import DiscussionsSection from '../components/home/DiscussionsSection';
import BibleStoriesSection from '../components/home/BibleStoriesSection';
import ActivityModal from '../features/activities/components/ActivityModal';
import DailyProgressPage from '../features/activities/components/DailyProgressPage';

// Import hooks
import useActivities from '../features/activities/hooks/useActivities';

// Import data
import { discussionTopics, bibleStories } from '../data/homeData';

export default function HomePage() {
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [showDailyProgress, setShowDailyProgress] = useState(false);
  
  const { 
    activities, 
    updateProgress, 
    addTime, 
    startTimer 
  } = useActivities();

  // Add debug log for activity selection
  const handleActivitySelect = (activity) => {
    console.log('Home page selecting activity:', {
      title: activity.title,
      type: activity.type,
      progress: activity.progress
    });
    setSelectedActivity(activity);
  };

  // If showing the daily progress page, render it
  if (showDailyProgress) {
    return (
      <DailyProgressPage
        onBack={() => setShowDailyProgress(false)}
      />
    );
  }

  return (
    <PageWrapper>
      {/* Daily Verse */}
      <View className="mt-6">
        <DailyVerse />
      </View>

      {/* Daily Progress */}
      <View className="mt-8">
        <DailyProgressRow 
          activities={activities}
          onActivitySelect={handleActivitySelect}
          onViewAll={() => setShowDailyProgress(true)}
        />
      </View>

      {/* Discussions */}
      <View className="mt-8">
        <DiscussionsSection topics={discussionTopics} />
      </View>

      {/* Bible Stories */}
      <View className="mt-8 mb-6">
        <BibleStoriesSection stories={bibleStories} />
      </View>

      {/* Activity Modal */}
      {selectedActivity && (
        <ActivityModal
          activity={selectedActivity}
          onClose={() => setSelectedActivity(null)}
          onUpdateProgress={updateProgress}
          onAddTime={addTime}
          onStartTimer={startTimer}
        />
      )}
    </PageWrapper>
  );
}
