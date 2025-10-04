// QuranFullReader.jsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const QuranFullReader = () => {
  const [versesBySurah, setVersesBySurah] = useState([]);
  const [firstSurahLoaded, setFirstSurahLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [loadingRest, setLoadingRest] = useState(false);

   const surahNumbers = [   1, 2, 3, 4, 5, 6, 7, 8, 9, 10,   11, 12, 13, 14, 15, 16, 17, 18, 19, 20,  21, 22, 23, 24, 25, 26, 27, 28, 29, 30,   31, 32, 33, 34, 35, 36, 37, 38, 39, 40,41, 42, 43, 44, 45, 46, 47, 48, 49, 50,51, 52, 53, 54, 55, 56, 57, 58, 59, 60,   61, 62, 63, 64, 65, 66, 67, 68, 69, 70,   71, 72, 73, 74, 75, 76, 77, 78, 79, 80,   81, 82, 83, 84, 85, 86, 87, 88, 89, 90,   91, 92, 93, 94, 95, 96, 97, 98, 99, 100,   101, 102, 103, 104, 105, 106, 107, 108, 109, 110,   111, 112, 113, 114 ];

//   const surahNumbers = [1, 2, 3, 4];

  // Load cached surahs from AsyncStorage
  const loadCachedSurahs = async () => {
    try {
      let cachedData = [];

      for (const num of surahNumbers) {
        const cached = await AsyncStorage.getItem(`surah_${num}`);
        if (cached) {
            console.log(`Surah ${num} data:`, JSON.parse(cached));
          cachedData.push(JSON.parse(cached));
        } else {
          break; // If any surah missing, stop loading cache here
        }
      }

      if (cachedData.length) {
        setVersesBySurah(cachedData);
        setFirstSurahLoaded(true);
      }
    } catch (err) {
      console.log('Error loading cached surahs:', err);
    }
  };

  // Fetch surahs from API, save in AsyncStorage and update state progressively
  const fetchSurahs = async () => {
    setError(null);
    // If no cache shown yet, clear list to show loader properly
    if (!firstSurahLoaded) {
      setVersesBySurah([]);
    }
    setLoadingRest(false);

    try {
      for (let i = 0; i < surahNumbers.length; i++) {
        const surahNum = surahNumbers[i];

        const res = await axios.get(
          `https://api.quran.com/api/v4/chapters/${surahNum}`,
        );
        const chapter = res.data.chapter;

        const versesRes = await axios.get(
          `https://api.quran.com/api/v4/verses/by_chapter/${surahNum}`,
          {
            params: {
              language: 'ar',
              fields: 'text_uthmani',
              per_page: 300,
            },
          },
        );

        const newSurah = {
          surahNumber: surahNum,
          surahName: chapter.name_simple,
          verses: versesRes.data.verses || [],
        };

        // Save to AsyncStorage
        await AsyncStorage.setItem(
          `surah_${surahNum}`,
          JSON.stringify(newSurah),
        );

        // Update state progressively
        setVersesBySurah(prev => {
          // Avoid duplicates if data already present
          if (prev.find(s => s.surahNumber === surahNum)) return prev;
          return [...prev, newSurah];
        });

        // After first surah loaded
        if (i === 0) {
          setFirstSurahLoaded(true);
          setLoadingRest(true); // show loading for remaining
        }
      }

      setLoadingRest(false); // done loading all
    } catch (err) {
      setError('Failed to load Surahs.');
      console.error('Fetch Error:', err.message);
    }
  };

  useEffect(() => {
    loadCachedSurahs();
    fetchSurahs();
  }, []);

  const renderVerse = ({ item }) => (
    <View style={styles.verseContainer}>
      <Text style={styles.surahInfo}>Ayah {item.verse_number}</Text>
      <Text style={styles.verseText}>{item.text_uthmani}</Text>
    </View>
  );

  const renderSurah = ({ item }) => (
    <View style={styles.surahBlock}>
      <Text style={styles.surahTitle}>
        Surah {item.surahNumber}: {item.surahName}
      </Text>
      <FlatList
        data={item.verses}
        keyExtractor={verse => verse.id.toString()}
        renderItem={renderVerse}
        scrollEnabled={false}
      />
    </View>
  );

  // Show loader only if first surah not loaded and no error
  if (!firstSurahLoaded && !error) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Loading Surah's..</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        data={versesBySurah}
        keyExtractor={item => item.surahNumber.toString()}
        renderItem={renderSurah}
        contentContainerStyle={{ padding: 16 }}
      />

      {/* Loader for remaining surahs */}
      {loadingRest && (
        <View style={styles.loadingMore}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={{ marginLeft: 8 }}>Loading Surah's...</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surahBlock: {
    marginBottom: 30,
  },
  surahTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#007AFF',
  },
  verseContainer: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderColor: '#eee',
    paddingBottom: 10,
  },
  surahInfo: {
    fontSize: 16,
    color: '#555',
    marginBottom: 6,
  },
  verseText: {
    fontSize: 28,
    textAlign: 'right',
    lineHeight: 40,
    fontFamily: 'Geeza Pro',
  },
  loadingMore: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
});

export default QuranFullReader;
