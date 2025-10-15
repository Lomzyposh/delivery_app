import { Stack } from "expo-router";

export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: "center" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen name="cart" options={{ title: "Cart" }} />
      <Stack.Screen name="listMeals"
        options={({ route }) => ({
          title: route.params?.title ?? "Meals",
        })} />
    </Stack>
  );
}
