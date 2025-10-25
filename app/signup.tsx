import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SocialButton from '@/components/ui/SocialButton';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import translateSpanish from '../lib/translator';

const dumbbeLeft = require('../assets/images/login/gym3.png');
const dumbbeRight = require('../assets/images/login/gym4.png');
const userIcon = require('../assets/images/login/user-shape.png');
const lockIcon = require('../assets/images/login/padlock.png');
const facebookIcon = require('../assets/images/login/facebook.png');
const googleIcon = require('../assets/images/login/google.png');
const twitterIcon = require('../assets/images/login/twitter.png');

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    const userId = data.user?.id;
    if (userId) {
      const { error: dbError } = await supabase
        .from('users')
        .insert([
          {
            id: userId,
            name: email.split('@')[0], // You can ask for name in your form if needed
            email,
          },
        ]);
      if (dbError) {
        Alert.alert('Error al guardar usuario', dbError.message);
      }
    }

    setLoading(false);

    if (error) {
      Alert.alert('Error de registro', translateSpanish(error.message)); // Traducción al español
    } else {
      Alert.alert(
        'Registro exitoso',
        '¡Cuenta creada! Por favor revisa tu correo electrónico para confirmar tu cuenta.' // Traducción al español
      );
      router.replace('/login');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.bgDumbbellsLeft}>
        <Image source={dumbbeLeft} style={styles.bgDumbbell} />
        <Image source={dumbbeLeft} style={[styles.bgDumbbell, { marginTop: 80 }]} />
      </View>
      <View style={styles.bgDumbbellsRight}>
        <Image source={dumbbeRight} style={[styles.bgDumbbell, { marginTop: 40 }]} />
        <Image source={dumbbeRight} style={[styles.bgDumbbell, { marginTop: 120 }]} />
      </View>

      <View style={styles.mainLogoContainer}>
        <Image source={dumbbeLeft} style={styles.mainDumbbell} />
        <Text style={styles.gymnasticText}>
          FIT<Text style={styles.ticText}>BEST</Text>
        </Text>
        <Text style={styles.tagline}>Crea tu cuenta</Text>
      </View>

      <View style={styles.formContainer}>
        <Input
          icon={userIcon}
          placeholder="Correo"
          onChangeText={setEmail}
        />
        <Input
          icon={lockIcon}
          placeholder="Clave"
          secureTextEntry={true}
          onChangeText={setPassword}
        />
        <Input
          icon={lockIcon}
          placeholder="Confirmar Clave"
          secureTextEntry={true}
          onChangeText={setConfirmPassword}
        />
        <Button
          title={loading ? 'Registrando...' : 'Registrarse'}
          disabled={loading}
          backgroundColorProp='#F34E3A'
          textColor='#FFFFFF'
          buttonStyle={{ marginTop: 20 }}
          onPress={handleSignup}
        />
      </View>
      <Text style={styles.loginWithText}>o continua con</Text>
      <View style={styles.socialLoginContainer}>
        <SocialButton icon={facebookIcon} onPress={() => console.log('Facebook Login')} />
        <SocialButton icon={googleIcon} onPress={() => console.log('Google Login')} />
        <SocialButton icon={twitterIcon} onPress={() => console.log('Twitter Login')} />
      </View>
      <TouchableOpacity onPress={() => router.push('/login')}>
        <Text style={styles.hasAccount}>¿Ya tienes una cuenta? <Text style={styles.underline}>Ingresar</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#141516',
    gap: 30,
    paddingTop: 50,
    paddingBottom: 50, // Add bottom padding for scroll
    height: '100%',
  },
  bgDumbbellsLeft: {
    position: 'absolute',
    left: -20,
    top: '20%',
  },
  bgDumbbellsRight: {
    position: 'absolute',
    right: -20,
    top: '30%',
  },
  mainLogoContainer: {
    alignItems: 'center',
  },
  mainDumbbell: {
    width: 120,
    height: 60,
    resizeMode: 'contain',
    tintColor: 'white',
  },
  bgDumbbell: {
    width: 80,
    height: 100,
    resizeMode: 'contain',
    tintColor: 'white',
    opacity: 0.1
  },
  gymnasticText: {
    color: '#fff',
    fontSize: 50,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginTop: 10,
  },
  ticText: {
    color: '#ff4d4d',
  },
  tagline: {
    fontSize: 18,
    marginTop: 5,
    fontStyle: 'italic',
    color: '#656565'
  },
  loginWithText: {
    color: '#424242',
    fontSize: 20,
    textAlign: 'center',
  },
  socialLoginContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 20,
  },
  socialButton: {
    width: 60,
    height: 60,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    width: 50,
    height: 50
  },
  hasAccount: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center'
  },
  formContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 40,
  },
  underline: {
    textDecorationLine: 'underline',
    color: '#008DC9'
  }
});