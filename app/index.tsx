import Button from '@/components/ui/Button';
import { ImageBackground } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useContext, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { AuthContext, AuthProvider } from '../context/AuthContext';
import Home from './home';


const images = [
  require('../assets/images/home.png'),
  require('../assets/images/home2.png'),
  require('../assets/images/home3.png'),
];

const slides = [
  {
    id: '1',
    image: images[0],
    title: 'Bienvenido a FitBest',
    description: '¡Comienza tu viaje fitness hoy!',
  },
  {
    id: '2',
    image: images[1],
    title: 'Sigue tu progreso',
    description: 'Monitorea tus entrenamientos y mejoras.',
  },
  {
    id: '3',
    image: images[2],
    title: 'Mantente motivado en cuerpo y mente',
    description: 'Alcanza tus metas con nuestra guía.',
  },
];

function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const handleNextPress = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      router.push('/login');
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfigRef = useRef({ viewAreaCoveragePercentThreshold: 50 });

  const renderItem = ({ item }: { item: typeof slides[0] }) => (
    <ImageBackground
      source={item.image}
      style={styles.background}
      contentFit="fill"
    >
      <LinearGradient
        colors={[
          'rgba(0,0,0,1)',   // top dark
          'rgba(0,0,0,1)',
          'rgba(0,0,0,0)',   // middle transparent
          'rgba(0,0,0,0)',
          'rgba(0,0,0,0)',
          'rgba(0,0,0,0)',   // center clear
          'rgba(0,0,0,0)',
          'rgba(0,0,0,0.5)',
          'rgba(0,0,0,1)',
          'rgba(0,0,0,1)',   // bottom dark
          'rgba(0,0,0,1)',
          'rgba(0,0,0,1)'
        ]}
        style={styles.gradient} />

      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.description}</Text>
      </View>

      {/* Pagination Dots */}
      <View style={styles.dotsContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              currentIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>

      <Button
        title={item.id == '3' ? 'Comenzar' : 'Siguiente'}
        {...(item.id === '3' ? {
          backgroundColorProp: '#F34E3A',
          textColor: '#FFFFFF'
        } : {})}
        buttonStyle={{ marginBottom: 75, width: '85%' }}
        onPress={handleNextPress}
      />
    </ImageBackground>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewConfigRef.current}
      />
    </View>
  );
}

function AppContent() {
  const { session, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return session ? <Home /> : <OnboardingScreen />;
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    justifyContent: 'flex-end',
    width,
    alignItems: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    marginBottom: 20,
  },
  title: {
    fontSize: 35,
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 50,
  },
  dot: {
    width: 20,
    height: 8,
    borderRadius: 100,
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#FFFFFF',

  },
  inactiveDot: {
    backgroundColor: '#FFFFFF',
    opacity: 0.3,
  }
});
