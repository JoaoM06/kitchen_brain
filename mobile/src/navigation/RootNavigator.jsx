import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import RecipesScreen from "../screens/RecipesScreen";
import StockScreen from "../screens/StockScreen";
import AddItemOptionsScreen from "../screens/AddItemOptionsScreen";
import BarcodeScannerScreen from "../screens/BarcodeScannerScreen";
import CardapioBotScreen from "../screens/CardapioBotScreen";
import MainTabs from "./MainTabs";
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

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Rotas publicas */}
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        
        {/* Rotas privadas */}
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Recipes" component={RecipesScreen} options={{ title: "Receitas" }} />
        <Stack.Screen name="Stock" component={StockScreen} options={{ title: "Estoque" }} />
        <Stack.Screen name="InsightsTab" component={InsightsNavigator} options={{ title: "Insights" }} />
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen name="AddItemOptions" component={AddItemOptionsScreen} />
        <Stack.Screen name="BarcodeScannerScreen" component={BarcodeScannerScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Insights" component={CardapioBotScreen} options={{ headerShown: true, title: "CardapioBot" }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
