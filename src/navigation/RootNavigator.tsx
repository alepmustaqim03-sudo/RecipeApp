import React from "react";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import RecipeListScreen from "../screens/RecipeListScreen";
import RecipeDetailScreen from "../screens/RecipeDetailScreen";
import RecipeFormScreen from "../screens/RecipeFormScreen";
import { colors } from "../theme";

const Stack = createNativeStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, text: colors.text }
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator
        screenOptions={{
          headerStyle:{ backgroundColor: colors.card },
          headerTitleStyle:{ color: colors.text },
          headerTintColor: colors.text
        }}>
        <Stack.Screen name="List" component={RecipeListScreen} options={{ title: "Recipe Book" }}/>
        <Stack.Screen name="Detail" component={RecipeDetailScreen} options={{ title: "Recipe" }}/>
        <Stack.Screen name="Form" component={RecipeFormScreen} options={{ title: "Add / Edit" }}/>
      </Stack.Navigator>
    </NavigationContainer>
  );
}
