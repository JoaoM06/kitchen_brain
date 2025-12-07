import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";

// privado
import OnboardingScreen from "../screens/OnboardingScreen";
import RecipesScreen from "../screens/RecipesScreen";
import StockScreen from "../screens/StockScreen";
import AddItemOptionsScreen from "../screens/AddItemOptionsScreen";
import BarcodeScannerScreen from "../screens/BarcodeScannerScreen";
import CardapioBotScreen from "../screens/CardapioBotScreen";
import MainTabs from "./MainTabs";
import ManualAddScreen from "../screens/ManualAddScreen";
import ConfirmItemsScreen from "../screens/ConfirmItemsScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";

import { useAuth } from "../context/AuthContext";

// se tiver uma tela “home” de insights, use-a; se não, use o próprio bot como raiz
const InsightsHome = CardapioBotScreen;

const Tab = createBottomTabNavigator();
const InsightsStack = createNativeStackNavigator();

function InsightsNavigator() {
  return (
    <InsightsStack.Navigator screenOptions={{ headerShown: false }}>
      <InsightsStack.Screen name="InsightsHome" component={InsightsHome} />
      <InsightsStack.Screen name="CardapioBot" component={CardapioBotScreen} />
    </InsightsStack.Navigator>
  );
}

const Stack = createNativeStackNavigator();

function PublicStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown:false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function PrivateStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown:false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="Recipes" component={RecipesScreen} />
      <Stack.Screen name="Stock" component={StockScreen} />
      <Stack.Screen name="Config" component={ConfigsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="VoiceRec" component={VoiceRecScreen} />
      <Stack.Screen name="AddItemOptions" component={AddItemOptionsScreen} />
      <Stack.Screen name="BarcodeScannerScreen" component={BarcodeScannerScreen}/>
      <Stack.Screen name="ManualAdd" component={ManualAddScreen} />
      <Stack.Screen name="ConfirmItems" component={ConfirmItemsScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { user } = useAuth();
  return (
    <NavigationContainer>
      {user ? <PrivateStack /> : <PublicStack />}
    </NavigationContainer>
  );
}
