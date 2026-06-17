import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SplashScreen } from '../screens/SplashScreen';
import { AgentsListScreen } from '../screens/AgentsListScreen';
import { AgentEditScreen } from '../screens/AgentEditScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { PrivacyScreen } from '../screens/PrivacyScreen';
import { useTheme } from '../theme/ThemeContext';
import { BotIcon, UserIcon } from '../components/icons';
import { Text } from 'react-native';
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

function MainTabs() {
  const { colors } = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabel: ({ focused, color }) => {
          const label = route.name === 'Agents' ? '智能体' : '我的';
          return (
            <Text style={{ fontSize: 11, color, fontWeight: focused ? '600' : '400', marginTop: 2 }}>
              {label}
            </Text>
          );
        },
        tabBarIcon: ({ color }) => {
          return route.name === 'Agents' ? (
            <BotIcon size={24} color={color} />
          ) : (
            <UserIcon size={24} color={color} />
          );
        },
      })}
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
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.background },
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
