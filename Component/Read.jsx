// SurahReader.js
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
import LinearGradient from 'react-native-linear-gradient';

const SurahReader = ({ route }) => {
  const { surahNumber } = route.params;
  const [surahData, setSurahData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSurah = async () => {
    try {
      console.log(`🔄 Attempting to load Surah ${surahNumber}...`);

      const cached = await AsyncStorage.getItem(`surah_${surahNumber}`);
      if (cached) {
        console.log(`📦 Loaded Surah ${surahNumber} from cache.`);
        setSurahData(JSON.parse(cached));
        setLoading(false);
      } else {
        console.log(`🌐 Fetching Surah ${surahNumber} from API...`);

        const chapterRes = await axios.get(
          `https://api.quran.com/api/v4/chapters/${surahNumber}`
        );
        console.log('✅ Chapter Response:', chapterRes.data);

        const versesRes = await axios.get(
          `https://api.quran.com/api/v4/verses/by_chapter/${surahNumber}`,
          {
            params: {
              language: 'ar',
              fields: 'text_indopak',
              per_page: 300,
            },
          }
        );
        console.log('✅ Verses Response:', versesRes.data);

        const newSurah = {
          surahNumber,
          surahName: chapterRes.data.chapter.name_simple,
          verses: versesRes.data.verses || [],
        };

        await AsyncStorage.setItem(
          `surah_${surahNumber}`,
          JSON.stringify(newSurah)
        );
        console.log(`💾 Cached Surah ${surahNumber} for future use.`);

        setSurahData(newSurah);
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ Error loading Surah:', err);
      setError('Failed to load Surah.');
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSurah();
  }, [surahNumber]);

  if (loading) {
    return (
      <LinearGradient colors={['#ffffff', '#f0f0f0']} style={styles.background}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#555" />
          <Text style={{ color: '#555', marginTop: 10 }}>Loading Surah...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error) {
    return (
      <LinearGradient colors={['#ffffff', '#f0f0f0']} style={styles.background}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
        <View style={styles.center}>
          <Text style={{ color: 'red' }}>{error}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#ffffff', '#f0f0f0']} style={styles.background}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <View style={styles.container}>
        <Text style={styles.surahTitle}>{surahData.surahName}</Text>
        <FlatList
          data={surahData.verses}
          keyExtractor={(verse) => verse.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.verseCard}>
              <Text style={styles.surahInfo}>Ayah {item.verse_number}</Text>
              <Text style={styles.verseText}>
                {item.text_indopak || item.text_uthmani}
              </Text>
            </View>
          )}
        />
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    position: 'relative',
    paddingTop: 50,
  },
  circle1: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#0000000a',
    top: -50,
    left: -50,
  },
  circle2: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: '#0000000b',
    top: 100,
    right: -100,
  },
  circle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#0000000c',
    bottom: -50,
    left: 50,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  surahTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#555',
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  verseCard: {
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 16,
  },
  surahInfo: {
    fontSize: 16,
    color: '#555',
    marginBottom: 6,
    fontWeight: '500',
  },
  verseText: {
  fontSize: 35,
  textAlign: 'right',
  lineHeight: 42,
  color: '#333',
  fontFamily: 'KFGQPC-Uthman', // font ka exact naam jo aapne dala hai
},
});

export default SurahReader;
