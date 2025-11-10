import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Tabs } from 'expo-router';

export default function TabsLayout() {
    return (
        <Tabs screenOptions={{ tabBarActiveTintColor: '#F34E3A', headerShown: false }}>
            <Tabs.Screen
                name="index"
                options={{
                    tabBarIcon: ({ color }) => <FontAwesome name="home" size={22} color={color} />,
                    tabBarLabel: 'Inicio',
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: 'Settings',
                    tabBarIcon: ({ color }) => <FontAwesome name="cog" size={22} color={color} />,
                }}
            />
        </Tabs>
    );
}