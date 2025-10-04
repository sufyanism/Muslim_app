// QiblaCompass.js
import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  PermissionsAndroid,
  Platform,
  ActivityIndicator,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import Geolocation from 'react-native-geolocation-service';
import CompassHeading from 'react-native-compass-heading';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const COMPASS_SIZE = width * 0.8;
const CENTER = COMPASS_SIZE / 2;

const MAKKAH_LAT = 21.4225;
const MAKKAH_LON = 39.8262;

function calculateQiblaBearing(lat1, lon1) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const toDeg = (rad) => (rad * 180) / Math.PI;

  const φ1 = toRad(lat1);
  const φ2 = toRad(MAKKAH_LAT);
  const Δλ = toRad(MAKKAH_LON - lon1);

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x =
    Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);

  let θ = Math.atan2(y, x);
  θ = toDeg(θ);
  return (θ + 360) % 360;
}

const QiblaCompass = () => {
  const [coords, setCoords] = useState(null);
  const [qiblaDirection, setQiblaDirection] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  const animatedHeading = useRef(new Animated.Value(0)).current;
  const lastHeading = useRef(0);
  const [currentHeading, setCurrentHeading] = useState(0);

  useEffect(() => {
    const id = animatedHeading.addListener(({ value }) => {
      setCurrentHeading(value % 360);
    });
    return () => {
      animatedHeading.removeListener(id);
    };
  }, [animatedHeading]);

  useEffect(() => {
    const requestLocationPermission = async () => {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'App needs location access to find Qibla direction',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    };

    const getLocation = async () => {
      setLoading(true);
      setErrorMsg(null);

      const hasPermission = await requestLocationPermission();
      if (!hasPermission) {
        setErrorMsg('Location permission denied');
        setLoading(false);
        return;
      }

      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCoords(position.coords);
          setQiblaDirection(calculateQiblaBearing(latitude, longitude));
          setLoading(false);
        },
        (error) => {
          setErrorMsg(error.message);
          setLoading(false);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    };

    getLocation();
  }, []);

  useEffect(() => {
    const degree_update_rate = 1;

    CompassHeading.start(degree_update_rate, ({ heading }) => {
      if (typeof heading === 'number') {
        let newHeading = heading;
        let diff = newHeading - lastHeading.current;
        if (diff > 180) newHeading -= 360;
        else if (diff < -180) newHeading += 360;

        Animated.timing(animatedHeading, {
          toValue: newHeading,
          duration: 100,
          useNativeDriver: true,
          easing: (t) => t,
        }).start();

        lastHeading.current = newHeading;
      }
    });

    return () => CompassHeading.stop();
  }, [animatedHeading]);

  // Invert rotation for opposite direction
  const rotate = animatedHeading.interpolate({
    inputRange: [-360, 0, 360],
    outputRange: ['360deg', '0deg', '-360deg'], // inverted
  });

  const difference =
    qiblaDirection !== null
      ? Math.abs(qiblaDirection - ((currentHeading + 360) % 360))
      : null;
  const angleDifference =
    difference !== null ? (difference > 180 ? 360 - difference : difference) : null;

  if (loading) {
    return (
      <LinearGradient colors={['#ffffffff', '#f0f0f0']} style={styles.background}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#000000ff" />
          <Text style={styles.loadingText}>Fetching location and heading...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (errorMsg) {
    return (
      <LinearGradient colors={['#ffffffff', '#f0f0f0']} style={styles.background}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Error: {errorMsg}</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#ffffffff', '#f0f0f0']} style={styles.background}>
      <View style={styles.circle1} />
      <View style={styles.circle2} />
      <View style={styles.circle3} />

      <View style={styles.container}>
        <View
          style={[
            styles.compassContainer,
            { width: COMPASS_SIZE, height: COMPASS_SIZE, borderRadius: COMPASS_SIZE / 2 },
          ]}
        >
          <Animated.View
            style={{
              transform: [{ rotate }], // inverted rotation
              width: COMPASS_SIZE - 40,
              height: COMPASS_SIZE - 40,
              borderRadius: (COMPASS_SIZE - 40) / 2,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Image
              source={require('../assets/compas3.png')}
              style={{
                width: COMPASS_SIZE - 40,
                height: COMPASS_SIZE - 40,
                borderRadius: (COMPASS_SIZE - 40) / 2,
                position: 'absolute',
                top: 0,
                left: 0,
                transform: [{ rotate: '270deg' }],
              }}
            />
            {/* <View style={styles.northOverlayRight}>
              <Text style={styles.northText}>N</Text>
            </View> */}
          </Animated.View>

          <View style={styles.centerDot} />
        </View>

        <Text style={styles.directionText}>
          Qibla: {angleDifference !== null ? angleDifference.toFixed(0) : 'N/A'}°
        </Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  background: { flex: 1, position: 'relative' },
  circle1: { position: 'absolute', width: 200, height: 200, borderRadius: 100, backgroundColor: '#0000000a', top: -50, left: -50 },
  circle2: { position: 'absolute', width: 300, height: 300, borderRadius: 150, backgroundColor: '#0000000b', top: 100, right: -100 },
  circle3: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: '#0000000c', bottom: -50, left: 50 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  compassContainer: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  centerDot: { width: 10, height: 10, backgroundColor: '#555', borderRadius: 5, position: 'absolute', top: CENTER - 5, left: CENTER - 5 },
northOverlayRight: {
  position: 'absolute',
  right: 115,
  top: '50%',
  transform: [{ translateY: -140 }],
  alignItems: 'center',
  justifyContent: 'center',
},
northText: {
  color: 'red',      // make text red
  fontSize: 24,      // slightly bigger font
  fontWeight: 'bold',
},
// northOverlayFixed: {
//   position: 'absolute',
//   top: CENTER,             // center vertically
//   left: CENTER,            // center horizontally
//   transform: [
//     { translateX: -COMPASS_SIZE  }, // move left along X by radius
//     { translateY: -10 }                // adjust vertically for text height
//   ],
//   alignItems: 'center',
//   justifyContent: 'center',
// },

  directionText: { marginTop: 30, fontSize: 20, color: '#555', fontWeight: 'bold' },
  loadingText: { color: '#000000ff', marginTop: 10, fontSize: 16 },
  errorText: { color: 'red', fontSize: 16 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});

export default QiblaCompass;
