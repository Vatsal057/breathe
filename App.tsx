/**
 * Prana Pacer — Shiv Swarodaya Breath Calibration.
 * Dual-theme (Vibrant Ivory & Nocturnal Ember), ambient BackdropBloom,
 * physical GrainOverlay, and the interactive AngulSpanGauge.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme, type Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { NavigationBar } from 'expo-navigation-bar';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useFonts, Fraunces_400Regular, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import {
  ThemeProvider,
  easing,
  useTheme,
} from './src/theme';
import {
  PetalMark,
  TabHomeGlyph,
  TabMapGlyph,
  TabProgressGlyph,
  TabWhyGlyph,
} from './src/components/icons';
import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { MapScreen } from './src/screens/MapScreen';
import { ProgressScreen } from './src/screens/ProgressScreen';
import { LearnScreen } from './src/screens/LearnScreen';
import { SessionScreen } from './src/screens/SessionScreen';
import { CompleteScreen } from './src/screens/CompleteScreen';
import { MeasureScreen } from './src/screens/MeasureScreen';
import { loadOnboardingDone } from './src/storage/stats';
import type { RootStackParamList, TabParamList } from './src/navigation/types';
import './src/notifications/reminders';

const Tab = createBottomTabNavigator<TabParamList>();
const Stack = createNativeStackNavigator<RootStackParamList>();

function TabGlyph({
  kind,
  focused,
}: {
  kind: 'home' | 'map' | 'progress' | 'learn';
  focused: boolean;
}) {
  const { colors } = useTheme();
  const color = focused ? colors.ember : colors.ash;
  if (kind === 'home') return <TabHomeGlyph size={22} color={color} />;
  if (kind === 'map') return <TabMapGlyph size={22} color={color} />;
  if (kind === 'learn') return <TabWhyGlyph size={22} color={color} />;
  return <TabProgressGlyph size={22} color={color} />;
}

function BreathingLoader() {
  const { colors } = useTheme();
  const s = useSharedValue(0.85);

  useEffect(() => {
    s.value = withRepeat(
      withTiming(1.15, {
        duration: 1800,
        easing: Easing.bezier(easing.breath[0], easing.breath[1], easing.breath[2], easing.breath[3]),
      }),
      -1,
      true,
    );
  }, [s]);

  const style = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));

  return (
    <View style={[styles.loading, { backgroundColor: colors.ink }]}>
      <Animated.View style={style}>
        <PetalMark size={52} color={colors.ember} />
      </Animated.View>
    </View>
  );
}

/** Catches render crashes anywhere below and shows a calm fallback
 *  instead of a blank screen. */
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error(error);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.crashFallback}>
          <PetalMark size={44} color="#FF7F50" />
          <Text style={styles.crashTitle}>Something went wrong</Text>
          <Text style={styles.crashSub}>Restart the app to keep breathing.</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

function MainTabs() {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.ember,
        tabBarInactiveTintColor: colors.ash,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.hairline,
          borderTopWidth: 1,
          minHeight: 64,
          paddingTop: 8,
          paddingBottom: 10,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          letterSpacing: 0.3,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Practice',
          tabBarIcon: ({ focused }) => <TabGlyph kind="home" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarLabel: 'Journey',
          tabBarIcon: ({ focused }) => <TabGlyph kind="map" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{
          tabBarLabel: 'Depth',
          tabBarIcon: ({ focused }) => <TabGlyph kind="progress" focused={focused} />,
        }}
      />
      <Tab.Screen
        name="Learn"
        component={LearnScreen}
        options={{
          tabBarLabel: 'Learn',
          tabBarIcon: ({ focused }) => <TabGlyph kind="learn" focused={focused} />,
        }}
      />
    </Tab.Navigator>
  );
}

function AppBody({ navTheme }: { navTheme: Theme }) {
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;
    loadOnboardingDone().then((done) => {
      if (alive) setOnboardingDone(done);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (onboardingDone == null) return <BreathingLoader />;
  if (!onboardingDone) {
    return <OnboardingScreen onDone={() => setOnboardingDone(true)} />;
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="Session"
          component={SessionScreen}
          options={{ gestureEnabled: false }}
        />
        <Stack.Screen name="Complete" component={CompleteScreen} />
        <Stack.Screen name="Measure" component={MeasureScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppShell() {
  const { colors, isDark } = useTheme();

  const navTheme: Theme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      dark: isDark,
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        primary: colors.ember,
        background: colors.ink,
        card: colors.surface,
        text: colors.bone,
        border: colors.hairline,
      },
    }),
    [colors, isDark],
  );

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NavigationBar style={isDark ? 'dark' : 'light'} />
      <ErrorBoundary>
        <AppBody navTheme={navTheme} />
      </ErrorBoundary>
    </>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Fraunces_400Regular,
    Fraunces_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.initialFallback}>
        <PetalMark size={44} color="#FF7F50" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <SafeAreaProvider>
        <AppShell />
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialFallback: {
    flex: 1,
    backgroundColor: '#F6F1E7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crashFallback: {
    flex: 1,
    backgroundColor: '#F6F1E7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  crashTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B3A6B',
    marginTop: 12,
  },
  crashSub: {
    fontSize: 14,
    color: '#5A5A5A',
    textAlign: 'center',
  },
});
