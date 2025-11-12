import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
import OnboardingScreen from "../screens/OnboardingScreen";
import RecipesScreen from "../screens/RecipesScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import StockScreen from "../screens/StockScreen";
import ConfigsScreen from "../screens/ConfigsScreen";
import ProfileScreen from "../screens/ProfileScreen";
import PermissionsScreen from "../screens/PermissionsScreen";
import VoiceRecScreen from "../screens/VoiceRecScreen";
import AddItemOptionsScreen from "../screens/AddItemOptionsScreen";
import BarcodeScannerScreen from "../screens/BarcodeScannerScreen";
import NovoItemScreen from "../screens/ManualAddScreen";
import CardapioBotScreen from "../screens/CardapioBotScreen";

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
        <Stack.Screen name="Recipes" component={RecipesScreen} />
        <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
        <Stack.Screen name="Stock" component={StockScreen} />
        <Stack.Screen name="Config" component={ConfigsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="VoiceRec" component={VoiceRecScreen} />
        <Stack.Screen name="AddItemOptions" component={AddItemOptionsScreen} />
        <Stack.Screen name="BarcodeScannerScreen" component={BarcodeScannerScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="NovoItemScreen" component={NovoItemScreen} />
        <Stack.Screen name="CardapioBotScreen" component={CardapioBotScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
