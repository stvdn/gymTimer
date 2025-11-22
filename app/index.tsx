import { AuthContext } from '@/context/AuthContext';
import { Redirect } from 'expo-router';
import React, { useContext } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
    const { session, loading } = useContext(AuthContext);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#141516' }}>
                <ActivityIndicator size="large" color="#F34E3A" />
            </View>
        );
    }

    if (!session) {
        return <Redirect href="/Onboarding" />;
    }

    return <Redirect href="/(tabs)" />;
}
