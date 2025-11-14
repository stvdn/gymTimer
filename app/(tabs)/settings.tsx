import Header from '@/components/ui/Header';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';

const AVATAR_URI = 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?q=80&w=400&auto=format&fit=crop';

export default function SettingsScreen() {
    const router = useRouter();

    return (
        <GestureHandlerRootView style={styles.safeArea}>
            <View>
                {/* Header */}
                <Header title='Configuraciónes' />
                {/* Profile Section */}
                {/* Avatar */}
                <Image source={{ uri: AVATAR_URI }} style={styles.avatar} />

                {/* Name + email + birthday */}
                <View style={{ alignItems: 'center', marginTop: 12 }}>
                    <Text style={styles.name}>Madison Smith</Text>
                    <Text style={styles.email}>madisons@example.com</Text>
                    <Text style={styles.birthday}>
                        Birthday: <Text style={{ fontWeight: '600' }}>April 1st</Text>
                    </Text>
                </View>

                {/* Menu list */}
                <ScrollView style={styles.menu}>
                    <MenuItem icon="account-circle" label="Perfil" onPress={()=>router.push("/ProfileEdit")} />
                    {/*<MenuItem icon="star-circle" label="Favorito" />*/}
                    <MenuItem icon="shield-lock" label="Política de Privacidad" onPress={()=>console.log("click")} />
                    {/*<MenuItem icon="cog" label="Configuración" />*/}
                    <MenuItem icon="help-circle" label="Ayuda" onPress={()=>console.log("click")} />
                    <MenuItem icon="logout" label="Cerrar Sesión" onPress={()=>console.log("click")} />
                </ScrollView>
            </View>
        </GestureHandlerRootView>
    );
}

function MenuItem({ icon, label, onPress }: { icon: any; label: string, onPress: () => void }) {
    return (
        <TouchableOpacity activeOpacity={0.8} style={styles.menuItem} onPress={onPress}>
            <View style={styles.menuIconWrap}>
                <MaterialCommunityIcons name={icon} size={22} color="#FFFFFF" />
            </View>
            <Text style={styles.menuText}>{label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#F34E3A" />
        </TouchableOpacity>
    );
}

const PRIMARY = '#F34E3A';      
const CARD = '#1a1a1a';        
const WHITE = '#FFFFFF';       
const MUTED = '#CFCFE5';      

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        paddingTop: 75,
        backgroundColor: '#141516',
    },
    header: {
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        paddingTop: 18,
        paddingHorizontal: 20,
        paddingBottom: 56, // space for pill overlap
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        color: WHITE,
        fontSize: 18,
        fontWeight: '700',
    },
    avatar: {
        width: 140,
        height: 140,
        borderRadius: 100,
        alignSelf: 'center',
        borderWidth: 3,
        borderColor: PRIMARY,
    },
    name: {
        color: WHITE,
        fontSize: 20,
        fontWeight: '800',
    },
    email: {
        color: MUTED,
        fontSize: 13,
        marginTop: 2,
    },
    birthday: {
        color: WHITE,
        fontSize: 13,
        marginTop: 4,
        opacity: 0.95,
    },

    statsPill: {
        position: 'absolute',
        left: 20,
        right: 20,
        bottom: -26,
        backgroundColor: PRIMARY,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 12,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        color: WHITE,
        fontSize: 14,
        fontWeight: '800',
    },
    statLabel: {
        color: WHITE,
        fontSize: 10,
        opacity: 0.9,
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: 'rgba(255,255,255,0.28)',
        marginHorizontal: 8,
    },

    menu: {
        backgroundColor: CARD,
        marginTop: 40,
        marginHorizontal: 16,
        borderRadius: 16,
        paddingVertical: 6,
        overflow: 'hidden',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 14,
        borderBottomColor: '#2A2B31',
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    menuIconWrap: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: PRIMARY,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuText: {
        color: WHITE,
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
    },

    tabBar: {
        position: 'absolute',
        left: 10,
        right: 10,
        bottom: 10,
        height: 58,
        backgroundColor: PRIMARY,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 12,
        overflow: 'hidden',
    },
    tabIcon: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
