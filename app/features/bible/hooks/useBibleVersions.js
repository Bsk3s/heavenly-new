import { useState, useEffect } from 'react';
import { getBibleVersions } from '../api/bibleService';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Priority English versions
const PRIORITY_VERSIONS = ['KJV', 'NKJV', 'ESV', 'NIV', 'NLT', 'NASB', 'CSB'];

/**
 * Hook to fetch and manage Bible versions
 * @returns {Object} Bible versions data and state
 */
const useBibleVersions = () => {
  const [versions, setVersions] = useState([]);
  const [categorizedVersions, setCategorizedVersions] = useState({
    priorityEnglish: [],
    otherEnglish: [],
    otherLanguages: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentVersionId, setCurrentVersionId] = useState(null);

  // Fetch Bible versions on mount
  useEffect(() => {
    const fetchVersions = async () => {
      try {
        setLoading(true);
        const data = await getBibleVersions();
        setVersions(data);

        // Categorize versions
        const priority = [];
        const otherEnglish = [];
        const otherLanguages = {};

        data.forEach(version => {
          // Check if it's an English version
          if (version.language.id === 'eng') {
            // Check if it's a priority version
            if (PRIORITY_VERSIONS.includes(version.abbreviation)) {
              priority.push(version);
            } else {
              otherEnglish.push(version);
            }
          } else {
            // Group by language
            const langName = version.language.name || 'Other';
            if (!otherLanguages[langName]) {
              otherLanguages[langName] = [];
            }
            otherLanguages[langName].push(version);
          }
        });

        // Sort priority versions according to PRIORITY_VERSIONS order
        priority.sort((a, b) => {
          return PRIORITY_VERSIONS.indexOf(a.abbreviation) - PRIORITY_VERSIONS.indexOf(b.abbreviation);
        });

        // Sort other English versions alphabetically
        otherEnglish.sort((a, b) => a.name.localeCompare(b.name));

        // Sort other languages alphabetically
        Object.keys(otherLanguages).forEach(lang => {
          otherLanguages[lang].sort((a, b) => a.name.localeCompare(b.name));
        });

        setCategorizedVersions({
          priorityEnglish: priority,
          otherEnglish,
          otherLanguages
        });

        // Get saved version from storage or use first priority English version as default
        const savedVersionId = await AsyncStorage.getItem('currentBibleVersionId');

        if (savedVersionId && data.some(v => v.id === savedVersionId)) {
          setCurrentVersionId(savedVersionId);
        } else {
          // Default to KJV or first priority version if available
          const defaultVersion = priority.find(v => v.abbreviation === 'KJV') ||
            priority[0] ||
            otherEnglish[0] ||
            data[0];

          if (defaultVersion) {
            setCurrentVersionId(defaultVersion.id);
            await AsyncStorage.setItem('currentBibleVersionId', defaultVersion.id);
          }
        }

        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchVersions();
  }, []);

  // Change the current Bible version
  const changeVersion = async (versionId) => {
    if (versions.some(v => v.id === versionId)) {
      setCurrentVersionId(versionId);
      await AsyncStorage.setItem('currentBibleVersionId', versionId);
      return true;
    }
    return false;
  };

  // Get the current version object
  const currentVersion = versions.find(v => v.id === currentVersionId) || null;

  return {
    versions,
    categorizedVersions,
    loading,
    error,
    currentVersionId,
    currentVersion,
    changeVersion
  };
};

export default useBibleVersions; 