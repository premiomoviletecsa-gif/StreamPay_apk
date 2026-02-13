import { Stack } from 'expo-router';

export default function SetupLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0c0c0c' },
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
