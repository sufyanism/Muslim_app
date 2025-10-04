// Search.js
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

const Search = ({ navigation }) => {
  const [surahData, setSurahData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchAndCacheSurahs = async () => {
    try {
      let allSurahs = [];
      for (let i = 1; i <= 114; i++) {
        let cached = await AsyncStorage.getItem(`surah_${i}`);
        if (!cached) {
          const chapterRes = await axios.get(`https://api.quran.com/api/v4/chapters/${i}`);
          const versesRes = await axios.get(`https://api.quran.com/api/v4/verses/by_chapter/${i}`, {
            params: { language: 'ar', fields: 'text_uthmani', per_page: 300 },
          });
          const surah = {
            surahNumber: i,
            surahName: chapterRes.data.chapter.name_simple,
            verses: versesRes.data.verses,
          };
          await AsyncStorage.setItem(`surah_${i}`, JSON.stringify(surah));
          cached = JSON.stringify(surah);
        }
        const parsed = JSON.parse(cached);
        allSurahs.push(parsed);
        setSurahData([...allSurahs]);
        setFilteredData([...allSurahs]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching Surahs:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAndCacheSurahs();
  }, []);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredData(surahData);
    } else {
      const filtered = surahData.filter((surah) =>
        surah.surahName.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredData(filtered);
    }
  };

  const handleSurahPress = (surahNumber) => {
    navigation.navigate('Read', { surahNumber });
  };

  const renderSurahItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleSurahPress(item.surahNumber)}>
      <View style={styles.surahItem}>
        <View style={styles.itemRow}>
          <Icon name="book" size={24} color="#555" style={{ marginRight: 12 }} />
          <View>
            <Text style={styles.surahTitle}>
              {item.surahNumber}: {item.surahName}
            </Text>
            <Text style={styles.verseCount}>Total Verses: {item.verses.length}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#ffffff', '#f0f0f0']} style={styles.background}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <View style={styles.container}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Surah by name..."
          placeholderTextColor="#aaa"
          value={searchQuery}
          onChangeText={handleSearch}
        />
        {surahData.length === 0 ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#555" />
            <Text style={{ color: '#555', marginTop: 10 }}>Loading Surahs...</Text>
          </View>
        ) : filteredData.length === 0 ? (
          <Text style={styles.noResult}>No Surah found.</Text>
        ) : (
          <FlatList
            data={filteredData}
            keyExtractor={(item) => item.surahNumber.toString()}
            renderItem={renderSurahItem}
          />
        )}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, position: 'relative', paddingTop: 50 },
  circle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#0000000a', top: -50, left: -50 },
  circle2: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#0000000b', top: 100, right: -100 },
  circle3: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#0000000c', bottom: -50, left: 50 },
  container: { flex: 1, paddingHorizontal: 16, paddingBottom: 20 },
  searchInput: { height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.5)', paddingHorizontal: 16, marginBottom: 16, color: '#555', fontSize: 18, fontWeight: '500' },
  surahItem: { padding: 20, backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 25, borderWidth: 1, borderColor: '#ddd', marginBottom: 12 },
  itemRow: { flexDirection: 'row', alignItems: 'center' },
  surahTitle: { fontSize: 20, fontWeight: 'bold', color: '#555', textAlign: 'center', fontFamily: 'serif', fontStyle: 'italic' },
  verseCount: { fontSize: 16, color: '#555', marginTop: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  noResult: { textAlign: 'center', marginTop: 20, fontSize: 18, color: '#555', fontStyle: 'italic' },
});

export default Search;
