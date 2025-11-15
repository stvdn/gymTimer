import Header from '@/components/ui/Header';
import { supabase } from '@/lib/supabase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { GestureHandlerRootView, ScrollView } from 'react-native-gesture-handler';

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  dob: string | null;
  weight: number | null;
  height: number | null;
};

const PRIMARY = '#F34E3A';
const CARD = '#1a1a1a';
const WHITE = '#FFFFFF';
const MUTED = '#CFCFE5';

const getAvatarUrlFromName = (name: string | null | undefined) => {
  const trimmed = (name ?? '').trim();
  if (!trimmed) {
    return 'https://avatar-placeholder.iran.liara.run/noname';
  }

  // Replace spaces with + for the query
  const encoded = encodeURIComponent(trimmed.replace(/\s+/g, ' ')).replace(/%20/g, '+');

  return `https://avatar.iran.liara.run/username?username=${encoded}`;
};

export default function SettingsScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<UserRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        setLoading(true);

        // 1) Get auth user
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const user = authData.user;
        if (!user) {
          if (!mounted) return;
          setProfile(null);
          return;
        }

        // 2) Get profile row
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, dob, weight, height')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (!mounted) return;

        setProfile(data as UserRow | null);
      } catch (e) {
        console.warn('Error loading profile in SettingsScreen', e);
        if (mounted) setProfile(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadProfile();
    return () => {
      mounted = false;
    };
  }, []);

  const displayName = profile?.name || 'Sin nombre';
  const displayEmail = profile?.email || 'Sin email';
  const displayyWeight = profile?.weight != null ? `${profile.weight} kg` : 'N/A';
  const displayHeight = profile?.height != null ? `${profile.height} cm` : 'N/A';
  const avatarUrl = getAvatarUrlFromName(profile?.name);


  return (
    <GestureHandlerRootView style={styles.safeArea}>
      <View>
        <Header title="Configuraciónes" />

        {/* Avatar */}
        <Image source={{ uri: avatarUrl  }} style={styles.avatar} />

        {/* Name + email + birthday */}
        <View style={{ alignItems: 'center', marginTop: 12 }}>
          {loading ? (
            <ActivityIndicator size="small" color={PRIMARY} />
          ) : (
            <>
              <Text style={styles.name}>{displayName}</Text>
              <Text style={styles.email}>{displayEmail}</Text>
              <Text style={styles.birthday}>
                Peso:{' '}
                <Text style={{ fontWeight: '600' }}>{displayyWeight}</Text>
                {' '}Altura:{' '}
                <Text style={{ fontWeight: '600' }}>{displayHeight}</Text>
              </Text>
            </>
          )}
        </View>

        {/* Menu list */}
        <ScrollView style={styles.menu}>
          <MenuItem
            icon="account-circle"
            label="Perfil"
            onPress={() => router.push('/ProfileEdit')}
          />
          <MenuItem
            icon="shield-lock"
            label="Política de Privacidad"
            onPress={() => console.log('click')}
          />
          <MenuItem icon="help-circle" label="Ayuda" onPress={() => console.log('click')} />
          <MenuItem icon="logout" label="Cerrar Sesión" onPress={() => console.log('click')} />
        </ScrollView>
      </View>
    </GestureHandlerRootView>
  );
}

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) {
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
    paddingBottom: 56,
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
