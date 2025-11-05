// mobile/src/navigation/MainTabs.jsx
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RecipesScreen from "../screens/RecipesScreen";
import StockScreen from "../screens/StockScreen";
import CardapioBotScreen from "../screens/CardapioBotScreen";
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

export default function MainTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Recipes" component={RecipesScreen} options={{ title: "Receitas" }} />
      <Tab.Screen name="Stock" component={StockScreen} options={{ title: "Estoque" }} />
      <Tab.Screen name="InsightsTab" component={InsightsNavigator} options={{ title: "Insights" }} />
      {/* adicione outras abas se houver */}
    </Tab.Navigator>
  );
}
