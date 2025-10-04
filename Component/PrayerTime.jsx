import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import { Picker } from '@react-native-picker/picker';

export default function PrayerTime() {
  const [location, setLocation] = useState(null);
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [method, setMethod] = useState('3'); // Default method
  const [loading, setLoading] = useState(true);
  const [todayDate, setTodayDate] = useState('');
  const [dayName, setDayName] = useState('');
  const [nextPrayer, setNextPrayer] = useState(null);
  const [currentPrayer, setCurrentPrayer] = useState(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const intervalRef = useRef(null);

  const OPEN_CAGE_API_KEY = '83ba6e8c2103483e93658bb92d58aa5b';

  const prayerDescriptions = {
    Fajr: 'Two rak’ahs Fajr are better than the whole world.',
    Sunrise: 'The sunrise is a moment of spiritual renewal.',
    Dhuhr: 'Praying Dhuhr on time is highly rewarded.',
    Asr: 'Missing Asr prayer is a sign of negligence.',
    Maghrib: 'Praying Maghrib on time saves from punishment.',
    Isha: 'Praying Isha in congregation is like praying half the night.',
  };

  const methodsList = [
    { id: '0', name: 'Shia Ithna-Ansari' },
    { id: '1', name: 'University of Islamic Sciences, Karachi' },
    { id: '2', name: 'Islamic Society of North America (ISNA)' },
    { id: '3', name: 'Muslim World League (MWL)' },
    { id: '4', name: 'Umm Al-Qura University, Makkah' },
    { id: '5', name: 'Egyptian General Authority of Survey' },
    { id: '7', name: 'Institute of Geophysics, University of Tehran' },
    { id: '8', name: 'Gulf Region' },
    { id: '9', name: 'Kuwait' },
    { id: '10', name: 'Qatar' },
    { id: '11', name: 'Majlis Ugama Islam Singapura, Singapore' },
    { id: '12', name: 'Union Organization islamic de France' },
    { id: '13', name: 'Diyanet İşleri Başkanlığı, Turkey' },
    { id: '14', name: 'Spiritual Administration of Muslims of Russia' },
  ];

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setErrorMsg('Location permission denied');
        setLoading(false);
        return;
      }

      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ latitude, longitude });
          await fetchCityAndCountry(latitude, longitude);
          setTodayDate(getFormattedDate());
          setDayName(getDayName());
          await handlePrayerTime(latitude, longitude, method);
          setLoading(false);
        },
        (error) => {
          setErrorMsg('Error getting location: ' + error.message);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    }

    fetchData();
  }, [method]);

  useEffect(() => {
    if (prayerTimes) {
      const next = getNextPrayer(prayerTimes);
      setNextPrayer(next);
      const current = getCurrentPrayer(prayerTimes);
      setCurrentPrayer(current);
    }
  }, [prayerTimes]);

  useEffect(() => {
    if (!nextPrayer || !prayerTimes) {
      setRemainingSeconds(0);
      return;
    }

    function updateRemainingTime() {
      const now = new Date();
      const timeStr = prayerTimes[nextPrayer];
      if (!timeStr) return setRemainingSeconds(0);

      const [hour, minute] = timeStr.split(':').map(Number);
      const prayerDate = new Date(now);
      prayerDate.setHours(hour, minute, 0, 0);

      if (prayerDate <= now) prayerDate.setDate(prayerDate.getDate() + 1);

      const diff = Math.floor((prayerDate - now) / 1000);
      setRemainingSeconds(diff);
    }

    updateRemainingTime();
    intervalRef.current = setInterval(updateRemainingTime, 1000);
    return () => clearInterval(intervalRef.current);
  }, [nextPrayer, prayerTimes]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'ios') return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission Required',
          message: 'This app needs location access to fetch prayer times.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  };

  const fetchCityAndCountry = async (lat, lng) => {
    try {
      const response = await axios.get(
        `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${OPEN_CAGE_API_KEY}`
      );
      const components = response.data.results[0].components;
      setCity(components.city || components.town || components.village || '');
      setCountry(components.country || '');
    } catch {
      setCity('');
      setCountry('');
    }
  };

  const handlePrayerTime = async (lat, lng, methodValue) => {
    const today = new Date().toISOString().split('T')[0];
    const key = `prayerTimes-method-${methodValue}`;
    try {
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.date === today) {
          setPrayerTimes(parsed.times);
          return;
        }
      }
      const times = await fetchPrayerTimes(lat, lng, methodValue);
      if (times) {
        await AsyncStorage.setItem(key, JSON.stringify({ date: today, times }));
        setPrayerTimes(times);
      }
    } catch {
      setErrorMsg('Storage error');
    }
  };

  const fetchPrayerTimes = async (lat, lng, methodValue) => {
    try {
      const response = await axios.get('https://api.aladhan.com/v1/timings', {
        params: { latitude: lat, longitude: lng, method: parseInt(methodValue, 10) },
      });
      return response.data.data.timings;
    } catch {
      setErrorMsg('Failed to fetch prayer times');
      return null;
    }
  };

  const convertTo12Hour = (time24) => {
    if (!time24) return "--:--";
    const [hourStr, minuteStr] = time24.replace(/[^0-9:]/g, "").split(":");
    if (!hourStr || !minuteStr) return "--:--";
    let hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute.toString().padStart(2, "0")} ${ampm}`;
  };

  const getFormattedDate = () => new Date().toLocaleDateString('en-GB');
  const getDayName = () => new Date().toLocaleDateString('en-GB', { weekday: 'long' });

  const getNextPrayer = (times) => {
    const allowed = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const now = new Date();
    const prayerDates = Object.entries(times)
      .filter(([name]) => allowed.includes(name))
      .map(([name, time]) => {
        const [h, m] = time.split(':').map(Number);
        const d = new Date(); d.setHours(h, m, 0, 0); return { name, time: d };
      });
    return prayerDates.find(p => p.time > now)?.name || prayerDates[0].name;
  };

  const getCurrentPrayer = (times) => {
    const allowed = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
    const now = new Date();
    const prayerDates = Object.entries(times)
      .filter(([name]) => allowed.includes(name))
      .map(([name, time]) => {
        const [h, m] = time.split(':').map(Number);
        const d = new Date(); d.setHours(h, m, 0, 0); return { name, time: d };
      })
      .sort((a,b) => a.time-b.time);
    for (let i = prayerDates.length-1;i>=0;i--) if(prayerDates[i].time<=now) return prayerDates[i].name;
    return prayerDates[prayerDates.length-1].name;
  };

  const formatTime = (secs) => {
    const h=Math.floor(secs/3600), m=Math.floor((secs%3600)/60), s=secs%60;
    return [h,m,s].map(u=>u.toString().padStart(2,'0')).join(':');
  };

  if (loading) return (
    <LinearGradient colors={['#ffffff','#f0f0f0']} style={styles.background}>
      <View style={styles.centered}><ActivityIndicator size="large" color="#000000ff" /></View>
    </LinearGradient>
  );
  if (errorMsg) return (
    <LinearGradient colors={['#ffffff','#f0f0f0']} style={styles.background}>
      <View style={styles.centered}><Text style={styles.error}>{errorMsg}</Text></View>
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#ffffff','#f0f0f0']} style={styles.background}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.locationText}>📍 {city}, {country}</Text>

          {/* DROPDOWN PICKER */}
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={method}
              onValueChange={(itemValue) => setMethod(itemValue)}
              mode="dropdown"
              style={styles.picker}
            >
              {methodsList.map(({ id, name }) => (
                <Picker.Item key={id} label={name} value={id} />
              ))}
            </Picker>
          </View>

          <Text style={styles.nextPrayer}>
            Next: {nextPrayer} ({convertTo12Hour(prayerTimes[nextPrayer])})  ⏱ {formatTime(remainingSeconds)}
          </Text>
        </View>

        {Object.entries(prayerTimes)
          .filter(([name]) => ['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'].includes(name))
          .map(([name, time]) => (
            <View
              key={name}
              style={[
                styles.card,
                (name === currentPrayer) && styles.highlightedCard
              ]}
            >
              <Text style={styles.cardTitle}>{name} {convertTo12Hour(time)}</Text>
              <Text style={styles.cardDesc}>{prayerDescriptions[name]}</Text>
            </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  background:{flex:1},
  container:{padding:10,alignItems:'center'},
  centered:{flex:1,justifyContent:'center',alignItems:'center'},
  circle1:{position:'absolute',width:220,height:220,borderRadius:110,backgroundColor:'#0000000a',top:-50,left:-50},
  circle2:{position:'absolute',width:300,height:300,borderRadius:150,backgroundColor:'#0000000b',top:100,right:-80},
  circle3:{position:'absolute',width:150,height:150,borderRadius:75,backgroundColor:'#0000000c',bottom:-50,left:50},
  locationText:{fontSize:18,color:'#555',marginBottom:10,textAlign:'center'},

  pickerContainer: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 10,
    backgroundColor: 'rgba(202, 199, 199, 0.33)',
    width: '50%',
  },
  picker: {
    height: 50,
    width: '100%',
  },

  nextPrayer:{fontSize:18,color:'#555',marginVertical:5,fontWeight:'600',textAlign:'center'},
  highlightedCard:{borderColor:'#000000ff',borderWidth:2},
  card: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 25,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    width:'100%',
    fontWeight: '600',      // semi-bold description
  fontStyle: 'italic',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom:5,
  },
  cardDesc: {
    fontSize: 12,
    color: '#555',
    fontStyle: 'italic',
    textAlign:'center',
  },
  error:{color:'red',fontSize:18,textAlign:'center',marginHorizontal:20},
});
