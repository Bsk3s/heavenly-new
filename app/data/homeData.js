import { BookOpen, Heart, Sun, Moon } from 'lucide-react-native';

export const activities = [
  {
    id: 1,
    icon: Heart,
    title: 'Prayer Time',
    duration: '11 mins / 15 mins',
    progress: 73,
    streak: 0,
    color: 'red'
  },
  {
    id: 2,
    icon: BookOpen,
    title: 'Bible Reading',
    duration: '10 mins / 1 chapter',
    progress: 60,
    streak: 0,
    color: 'blue'
  },
  {
    id: 3,
    icon: Sun,
    title: 'Devotional',
    duration: '0 mins / 20 mins',
    progress: 0,
    streak: 0,
    color: 'orange'
  },
  {
    id: 4,
    icon: Moon,
    title: 'Evening Prayer',
    duration: '0 mins / 10 mins',
    progress: 0,
    streak: 0,
    color: 'purple'
  },
];

export const discussionTopics = [
  {
    id: 1,
    topic: "Creative Family Prayer Ideas",
    lastMessage: "Last message 5 days ago",
    participants: 24
  },
  {
    id: 2,
    topic: "Daily Devotional Tips",
    lastMessage: "Last message 2 days ago",
    participants: 18
  },
  {
    id: 3,
    topic: "Bible Study Methods",
    lastMessage: "Last message 1 day ago",
    participants: 32
  }
];

export const bibleStories = [
  {
    id: 1,
    title: "David and Goliath",
    description: "A story of courage and faith",
    imageSrc: "https://via.placeholder.com/400x300"
  },
  {
    id: 2,
    title: "Birth of Jesus",
    description: "The nativity story",
    imageSrc: "https://via.placeholder.com/400x300"
  },
  {
    id: 3,
    title: "Moses and the Exodus",
    description: "Journey to freedom",
    imageSrc: "https://via.placeholder.com/400x300"
  }
]; 