import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { SplashScreen } from '../screens/SplashScreen';
import { AgentsListScreen } from '../screens/AgentsListScreen';
import { AgentEditScreen } from '../screens/AgentEditScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { useTheme } from '../theme/ThemeContext';
import { BotIcon, UserIcon } from '../components/icons';
import { Agent } from '../types';

export type RootStackParamList = {
  Splash: undefined;
  Main: undefined;
  Chat: { agent: Agent };
  AgentEdit: { agent?: Agent };
  Privacy: undefined;
};

export type MainTabParamList = {
  Agents: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// 单个 Tab 项 — 独立组件以合法使用 hooks
function TabItem({
  isFocused,
  onPress,
  icon,
  label,
  inactiveColor,
}: {
  isFocused: boolean;
  onPress: () => void;
  icon: React.ReactNode;
  label: string;
  inactiveColor: string;
}) {
  const scale = useRef(new Animated.Value(isFocused ? 1 : 0.92)).current;
  useEffect(() => {
    Animated.spring(scale, { toValue: isFocused ? 1 : 0.92, useNativeDriver: true, friction: 5 }).start();
  }, [isFocused]);

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={styles.tabItem}>
      <Animated.View style={[styles.tabContent, { transform: [{ scale }] }]}>
        {icon}
        <Text style={[
          styles.tabLabel,
          { color: isFocused ? '#FFFFFF' : inactiveColor, fontWeight: isFocused ? '700' : '500' },
        ]}>
          {label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
}

// 自定义悬浮玻璃导航栏 — 小巧、固定、不会被推出屏幕
function GlassTabBar({ state, descriptors, navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(state.index === 0 ? 0 : 1)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: state.index === 0 ? 0 : 1,
      useNativeDriver: true,
      friction: 7,
      tension: 60,
    }).start();
  }, [state.index]);

  return (
    <View
      style={[
        styles.tabBarContainer,
        {
          paddingBottom: Math.max(insets.bottom, 6),
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: 'rgba(18, 18, 28, 0.72)',
            borderColor: colors.border,
            shadowColor: '#000',
          },
        ]}
      >
        {/* 滑块指示器 */}
        <Animated.View
          style={[
            styles.slider,
            {
              transform: [{
                translateX: slideAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 100], // approx half width, will be adjusted
                }),
              }],
            },
          ]}
        >
          <LinearGradient
            colors={colors.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.sliderGradient}
          />
        </Animated.View>

        {state.routes.map((route: any, index: number) => {
          const isFocused = state.index === index;
          const label = route.name === 'Agents' ? '智能体' : '我的';
          const icon = route.name === 'Agents' ? <BotIcon size={20} color={isFocused ? '#FFFFFF' : colors.textSecondary} /> : <UserIcon size={20} color={isFocused ? '#FFFFFF' : colors.textSecondary} />;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TabItem
              key={route.key}
              isFocused={isFocused}
              onPress={onPress}
              icon={icon}
              label={label}
              inactiveColor={colors.textSecondary}
            />
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      tabBar={(props) => <GlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Agents" component={AgentsListScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  const { colors } = useTheme();
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
            headerTitleStyle: { fontWeight: '700' },
          }}
        >
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ title: '对话' }} />
          <Stack.Screen
            name="AgentEdit"
            component={AgentEditScreen}
            options={{ title: '智能体设置' }}
          />
          <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: '隐私政策' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  tabBar: {
    flexDirection: 'row',
    width: '100%',
    maxWidth: 280,
    height: 48,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  slider: {
    position: 'absolute',
    top: 4,
    left: '25%',
    width: '50%',
    height: 40,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sliderGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    opacity: 0.9,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 0,
  },
});
