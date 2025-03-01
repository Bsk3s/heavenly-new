import { useState, useEffect } from 'react';
import { getChapterContent } from '../api/bibleService';

/**
 * Hook to fetch and manage Bible content
 * @param {string} bibleId - The ID of the current Bible version
 * @param {string} chapterId - The ID of the current chapter
 * @returns {Object} Bible content data and state
 */
const useBibleContent = (bibleId, chapterId) => {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [parsedVerses, setParsedVerses] = useState([]);
  const [chapterTitle, setChapterTitle] = useState('');
  const [reference, setReference] = useState('');

  // Fetch chapter content when Bible version or chapter changes
  useEffect(() => {
    if (!bibleId || !chapterId) {
      console.log('Missing bibleId or chapterId:', { bibleId, chapterId });
      return;
    }

    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await getChapterContent(bibleId, chapterId);
        console.log('Bible content data:', data);

        if (data) {
          // Extract reference
          setReference(data.reference || '');

          // Extract chapter title if available
          setChapterTitle(data.title || '');

          // Parse verses from the content
          if (data.verses && Array.isArray(data.verses)) {
            const verses = data.verses.map(verse => {
              const verseData = {
                id: verse.id || `${chapterId}-${verse.number}`,
                number: parseInt(verse.number, 10) || 1,
                text: verse.text
              };

              // Ensure verse text is properly formatted
              if (typeof verseData.text === 'object' && verseData.text.content) {
                verseData.text = verseData.text.content;
              }

              if (typeof verseData.text === 'string') {
                verseData.text = verseData.text.trim();
              } else {
                console.warn('Invalid verse text format:', verse);
                verseData.text = '';
              }

              return verseData;
            });

            console.log('Parsed verses:', verses);
            setParsedVerses(verses);
          } else {
            console.error('Invalid verses data:', data.verses);
            setParsedVerses([]);
          }

          setContent(data);
        } else {
          console.error('No data received from API');
          setReference('');
          setChapterTitle('');
          setParsedVerses([]);
          setContent(null);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error fetching chapter content:', err);
        setError(err.message);
        setLoading(false);
        setReference('');
        setChapterTitle('');
        setParsedVerses([]);
        setContent(null);
      }
    };

    fetchContent();
  }, [bibleId, chapterId]);

  return {
    reference,
    chapterTitle,
    parsedVerses,
    loading,
    error,
    content
  };
};

export default useBibleContent; 