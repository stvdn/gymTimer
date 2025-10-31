import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SocialButton from '@/components/ui/SocialButton';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import translateSpanish from '../lib/translator';

// Importa las imágenes PNG locales
const dumbbeLeft = require('../assets/images/login/gym3.png');
const dumbbeRight = require('../assets/images/login/gym4.png');
const userIcon = require('../assets/images/login/user-shape.png');
const lockIcon = require('../assets/images/login/padlock.png');
const facebookIcon = require('../assets/images/login/facebook.png');
const googleIcon = require('../assets/images/login/google.png');
const twitterIcon = require('../assets/images/login/twitter.png');

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      Alert.alert('Error de inicio de sesión', translateSpanish(error.message));
    } else {
      Alert.alert('Inicio de sesión exitoso', '¡Has iniciado sesión correctamente!');
      router.replace('/home');
    }
  }

  return (
    <View style={styles.container}>
      {/* Mancuernas de fondo (repetidas) */}
      <View style={styles.bgDumbbellsLeft}>
        <Image source={dumbbeLeft} style={styles.bgDumbbell} />
        <Image source={dumbbeLeft} style={[styles.bgDumbbell, { marginTop: 80 }]} />
      </View>
      <View style={styles.bgDumbbellsRight}>
        <Image source={dumbbeRight} style={[styles.bgDumbbell, { marginTop: 40 }]} />
        <Image source={dumbbeRight} style={[styles.bgDumbbell, { marginTop: 120 }]} />
      </View>

      {/* Logo principal */}
      <View style={styles.mainLogoContainer}>
        <Image source={dumbbeLeft} style={styles.mainDumbbell} />
        <Text style={styles.gymnasticText}>
          FIT<Text style={styles.ticText}>BEST</Text>
        </Text>
        <Text style={styles.tagline}>Train Smarter</Text>
      </View>

      {/* Formulario de login */}
      <View style={styles.formContainer}>
        {/* Campos de entrada */}
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

        <Button
          title='Ingresar'
          backgroundColorProp='#F34E3A'
          textColor='#FFFFFF'
          buttonStyle={{ marginTop: 20 }}
          onPress={handleLogin}
        />
      </View>

      {/* Opciones de login social */}
      <Text style={styles.loginWithText}>login with</Text>
      <View style={styles.socialLoginContainer}>
        <SocialButton icon={facebookIcon} onPress={() => console.log('Facebook Login')} />
        <SocialButton icon={googleIcon} onPress={() => console.log('Google Login')} />
        <SocialButton icon={twitterIcon} onPress={() => console.log('Twitter Login')} />
      </View>

      <View style={styles.linksContainer}>
        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={styles.linkText}>Eres nuevo? <Text style={styles.linkUnderline}>Registrate</Text></Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => console.log('Forgot Password')}>
          <Text style={styles.linkUnderlineFor}>Recuperar contraseña</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141516',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
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
    tintColor: 'white', // Esto asume que el PNG es de un solo color y se puede teñir
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
    marginBottom: 20,
  },
  socialLoginContainer: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 30,
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
  linkUnderline: {
    textDecorationLine: 'underline',
    color: '#008DC9'
  },
  formContainer: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    gap: 10,
    marginBottom: 30,
    paddingHorizontal: 40,
  },
  linksContainer: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    gap: 10
  },
  linkText: {
    color: '#fff',
    fontSize: 18,
    textDecorationLine: 'none',
  },
  linkUnderlineFor: {
    textDecorationLine: 'underline',
    color: '#008DC9',
    fontSize: 18,
  }
});