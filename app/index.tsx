import { Redirect } from 'expo-router';

export default function IndexPage() {
  // Automatically redirect the root URL to the Explore tab
  return <Redirect href="/(tabs)/explore" />;
}