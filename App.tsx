// App.js
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Search from './Component/SearchSurah';
import SurahReader from './Component/Read';
import Deirection from './Component/Deirection'
import Home from'./Component/Home'
import PrayerTime from './Component/PrayerTime'
import Read from './Component/Read'
import Reading from './Component/Reading'
import SearchSurah from './Component/SearchSurah'

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator  initialRouteName="Home" screenOptions={{
          headerShown: false,   // 🔥 hides the top bar everywhere
        }}>
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Deirection" component={Deirection} />
        <Stack.Screen name="PrayerTime" component={PrayerTime} />
        <Stack.Screen name="Read" component={Read} />
        {/* <Stack.Screen name="Reading" component={Reading} /> */}
        <Stack.Screen name="SearchSurah" component={SearchSurah} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
