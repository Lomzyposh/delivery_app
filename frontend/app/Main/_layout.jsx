import { Stack } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";

export default function MainLayout() {
  const { isDarkMode } = useTheme();
  const colorMode = isDarkMode ? "dark" : "light";
  return (
    <Stack screenOptions={{
      headerStyle: { backgroundColor: colorMode === "dark" ? "#474747ff" : "#fff" },
      headerTitleStyle: { color: colorMode === "dark" ? "#fff" : "#000" },
    }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen name="cart" options={{ title: "Cart" }} />
      <Stack.Screen name="listMeals"
        options={{
          title: "Meals",
        }} />
      <Stack.Screen name="specialOffers" options={{ title: "Special Offers" }} />
    </Stack>
  );
}
