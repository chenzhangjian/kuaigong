import { Stack } from 'expo-router';
import { AuthProvider } from '@/contexts/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="task-detail" />
        <Stack.Screen name="task-applications" />
        <Stack.Screen name="publish-task" />
        <Stack.Screen name="order-detail" />
        <Stack.Screen name="wallet" />
        <Stack.Screen name="bank-cards" />
        <Stack.Screen name="my-workers" />
        <Stack.Screen name="verification" />
        <Stack.Screen name="edit-profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="customer-service" />
        <Stack.Screen name="certificates" />
        <Stack.Screen name="privacy-policy" />
        <Stack.Screen name="user-agreement" />
        <Stack.Screen name="about" />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AuthProvider>
  );
}
