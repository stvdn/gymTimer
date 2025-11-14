import Button from '@/components/ui/Button';
import Header from '@/components/ui/Header';
import Input from '@/components/ui/Input';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const COLORS = {
  bg: '#141516',
  card: '#1a1a1a',
  accent: '#F34E3A',
  headerLavender: '#A78BFA',
  white: '#FFFFFF',
  subtle: '#CFCFE5',
  label: '#A1A1A8',
};

type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  dob: string | null;
  weight: string | null;
  height: string | null;
};

export default function ProfileEditScreen() {
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [dob, setDob] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch current auth user, then load profile row from users table
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        const user = data?.user;
        if (!user) {
          Alert.alert('Sesión', 'No hay usuario autenticado.');
          return;
        }
        if (!mounted) return;

        setAuthUserId(user.id);
        // Pull profile from your public.users table by auth uid
        const { data: rows, error: rowsErr } = await supabase
          .from('users')
          .select('id, name, email, phone, dob, weight, height')
          .eq('id', user.id)
          .maybeSingle();

        if (rowsErr) throw rowsErr;

        const profile: UserRow | null = rows as unknown as UserRow | null;
        // Hydrate form (fallbacks if null)
        setName(profile?.name ?? '');
        setEmail(profile?.email ?? '');
        setMobile(profile?.phone ?? '');
        setDob(profile?.dob ?? '');
        setWeight(profile?.weight != null ? String(profile.weight) : '');
        setHeight(profile?.height != null ? String(profile.height) : '');
      } catch (e: any) {
        console.warn(e);
        Alert.alert('Error', 'No se pudo cargar el perfil.');
        router.back();
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const parseOptNumber = (s: string) => {
    // Accepts "", "  ", "123", "123.4", "123,4"
    const trimmed = (s ?? '').trim();
    if (trimmed === '') return null;
    // Normalize comma to dot for decimals
    const normalized = trimmed.replace(',', '.');
    const n = Number(normalized);
    return Number.isFinite(n) ? n : null;
  };

  const onUpdate = async () => {
    if (!authUserId) {
      Alert.alert('Sesión', 'No hay usuario autenticado.');
      return;
    }

    try {
      setLoading(true);

      const updates = {
        id: authUserId,
        name: name || null,
        email: email || null,
        phone: mobile || null,
        dob: dob || null,
        // Convert from TextInput string state to numbers/null
        weight: parseOptNumber(weight),
        height: parseOptNumber(height),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('users').upsert(updates, { onConflict: 'id' });
      if (error) throw error;

      Alert.alert('Éxito', 'Perfil actualizado.');
    } catch (e: any) {
      console.warn(e);
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0} // tune this offset
    >
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <Header title="Editar Perfil" />
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Full name</Text>
          <Input
            name="user"
            placeholder="Full name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.fieldLabel}>Email</Text>
          <Input
            name="at"
            placeholder="Email"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <Text style={styles.fieldLabel}>Mobile Number</Text>
          <Input
            name="phone"
            placeholder="+123 567 89000"
            keyboardType="phone-pad"
            value={mobile}
            onChangeText={setMobile}
          />

          <Text style={styles.fieldLabel}>Date of birth</Text>
          <Input
            name="calendar-days"
            placeholder="DD / MM / YYYY"
            value={dob}
            onChangeText={setDob}
          />

          <Text style={styles.fieldLabel}>Weight</Text>
          <Input
            name="ruler-horizontal"
            placeholder="Weight"
            keyboardType="numeric"
            value={weight}
            onChangeText={setWeight}
          />

          <Text style={styles.fieldLabel}>Height</Text>
          <Input
            name="ruler-vertical"
            placeholder="Height"
            keyboardType="numeric"
            value={height}
            onChangeText={setHeight}
          />

          <Button
            title={loading ? 'Actualizando...' : 'Actualizar'}
            disabled={loading}
            backgroundColorProp={COLORS.accent}
            textColor={COLORS.white}
            buttonStyle={{ marginTop: 20 }}
            onPress={onUpdate}
            loading={loading}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.bg,
    paddingTop: 75,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 140,
    height: 140,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: COLORS.accent,
  },
  name: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 10,
  },
  email: {
    color: COLORS.subtle,
    fontSize: 13,
    marginTop: 2,
  },

  // Card style similar to menu container
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    marginHorizontal: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  fieldLabel: {
    color: COLORS.label,
    fontSize: 13,
    marginTop: 14,
    marginBottom: 8,
    fontWeight: '600',
  },
});
