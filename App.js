// App.js
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import HomeScreen from "./src/screens/HomeScreen";
import LoginScreen from "./src/screens/LoginScreen";
import PhotoScreen from "./src/screens/PhotoScreen";
import SplashScreen from "./src/screens/SplashScreen";
import SubscribeScreen from "./src/screens/SubscribeScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Subscribe" component={SubscribeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Photo" component={PhotoScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
