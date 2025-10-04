import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Animated } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import HijriDate from 'hijri-date/lib/safe';
import Icon from 'react-native-vector-icons/Feather';

const hijriMonthsUrduEnglish = [
  'Muharram', 'Safar', 'Rabi ul Awal', 'Rabi ul Thani', 'Jumada ul Awal', 'Jumada ul Thani',
  'Rajab', 'Shaban', 'Ramadan', 'Shawwal', 'Dhul Qadah', 'Dhul Hijjah'
];

const Home = ({ navigation }) => {
  const [hijriDate, setHijriDate] = useState('');
  const scaleAnim = new Animated.Value(0.8);

  const handleNavigation = (screenName) => {
    navigation.navigate(screenName);
  };

  return (
    <LinearGradient colors={['#ffffff', '#f0f0f0']} style={styles.background}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: 0 }}>
        <View style={styles.logoContainer}>
          <Animated.Image source={require('../assets/logo.png')} style={[styles.logo, { transform: [{ scale: scaleAnim }] }]} />
        </View>

        <View style={styles.bigCard}>
          <Text style={styles.bigCardText}>✨ Your Spiritual Journey ✨</Text>
          <Text style={styles.bigCardSubText}>Explore prayer times, Qibla direction, and read Quran all in one app.</Text>
        </View>

        <View style={styles.listContainer}>
          <TouchableOpacity style={styles.listButton} onPress={() => handleNavigation('Deirection')}>
            <Icon name="compass" size={22} color="#1e1e2d" style={styles.icon} />
            <Text style={styles.listText}>Qibla Direction</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.listButton} onPress={() => handleNavigation('PrayerTime')}>
            <Icon name="clock" size={22} color="#1e1e2d" style={styles.icon} />
            <Text style={styles.listText}>Prayer Times</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.listButton} onPress={() => handleNavigation('SearchSurah')}>
            <Icon name="book-open" size={22} color="#1e1e2d" style={styles.icon} />
            <Text style={styles.listText}>Al Quran</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>✨ Stay Connected, Stay Blessed ✨</Text>
          <Text style={styles.bottomText}>
            © {new Date().getFullYear()} zeba.academy, All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    position: 'relative',
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
    backgroundColor: '#0000000c',
    top: 100,
    right: -100,
  },
  circle3: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#0000000b',
    bottom: -50,
    left: 50,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 80,
    borderWidth: 4,
    borderColor: '#ffffffff',
  },
  bigCard: {
    marginHorizontal: 20,
    padding: 10,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 25,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  bigCardText: {
    fontSize: 24,
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  bigCardSubText: {
    fontSize: 18,
    color: '#555',
    textAlign: 'center',
    marginBottom: 10,
  },
  listContainer: {
    paddingHorizontal: 20,
    marginTop: 0,
  },
  listButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  icon: {
    marginRight: 15,
  },
  listText: {
    fontSize: 25,
    color: '#1e1e2d',
    fontFamily: 'serif',
    fontStyle: 'italic',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingBottom: 40,
  },
  footerText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  bottomText: {
    color: '#999',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default Home;
``