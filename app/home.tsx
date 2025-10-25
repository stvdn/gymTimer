import SessionCard from '@/components/ui/SessionCard';
import { supabase } from '@/lib/supabase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { LinearGradient } from 'expo-linear-gradient'; // Assuming use of Expo/LinearGradient
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';


interface Session {
  id: string;
  name: string;
  training_type: {
    name: string;
  };
}

interface User {
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

const images = [
  require('../assets/images/home/endurance.png'),
  require('../assets/images/home/hypertrophy.png'),
  require('../assets/images/home/strength.png'),
];

const getImageForTrainingType = (trainingTypeName: string): any => {

  const normalizedName = trainingTypeName.toLowerCase().trim();

  switch (normalizedName) {
    case 'resistencia':
      return images[0];
    case 'hipertrofia':
      return images[1];
    case 'fuerza':
      return images[2];
    default:
      return images[1]; // Fallback
  }
};

// Placeholder for the complex Current Status graph
const GraphPlaceholder = () => (
  <View style={styles.graphContainer}>
    {/* This area would typically use a library like react-native-svg,
        react-native-charts-wrapper, or react-native-gifted-charts */}
    <View style={styles.graphArea}>
      {/* Simple approximation of the graph curve */}
      <View style={styles.curve} />
    </View>
    <View style={styles.graphLabels}>
      {['day 1', 'day 2', 'day 3', 'day 4', 'day 5'].map((day, index) => (
        <Text key={index} style={styles.dayLabel}>
          {day}
        </Text>
      ))}
    </View>
  </View>
);

// --- Main Screen Component ---

export default function Home() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError) throw userError;
        if (!user) {
          Alert.alert('Error', 'No estás autenticado');
          router.replace('/login');
          return;
        }

        if (mounted) setUser(user);

        const { data: sessionsData, error: sessionsError } = await supabase
          .from('sessions')
          .select(`
          id,
          name,
          created_at,
          training_type:training_types!inner(name)
        `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (sessionsError) throw sessionsError;

        if (mounted && sessionsData) {
          // 👇 Transformación defensiva por si aún viene como array
          const transformedSessions = sessionsData.map((session: any) => ({
            ...session,
            training_type: Array.isArray(session.training_type)
              ? session.training_type[0]
              : session.training_type
          }));

          setSessions(transformedSessions);
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'No se pudieron cargar las sesiones');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);
  const handleAddSession = () => {
    router.push('/newsession');
  }

  return (
    <View style={styles.safeArea}>
      <ScrollView style={styles.container}>

        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome, Roberto !</Text>
          <Text style={styles.dateText}>Monday, 21 August 2020</Text>
          <TouchableOpacity style={styles.menuIcon}>
            <Text>
              <MaterialCommunityIcons name="dots-vertical" size={36} color="white" />
            </Text>
          </TouchableOpacity>
        </View>

        {/* --- Current Status Card --- */}
        <LinearGradient
          colors={['#1a1a1a', '#000000']} // Dark gradient approximation
          style={styles.statusCard}>
          <Text style={styles.cardTitle}>Current Status</Text>
          <GraphPlaceholder />
          <View style={styles.statusMetrics}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>78</Text>
              <Text style={styles.metricLabel}>BPM</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>340</Text>
              <Text style={styles.metricLabel}>KKAL</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>120</Text>
              <Text style={styles.metricLabel}>Weight</Text>
            </View>
          </View>
        </LinearGradient>

        {/* --- Activity Section --- */}
        <View style={styles.activitySection}>
          <View style={styles.sessionContainer}>
            <View style={{ flexDirection: 'column' }}>
              <Text style={styles.activityTitle}>Sesiones Entrenamiento</Text>

              <Text style={styles.activitySubtitle}>Elige tu sesisón</Text>
            </View>
            <TouchableOpacity style={styles.addButton} onPress={handleAddSession} activeOpacity={0.7}>
              <MaterialCommunityIcons name="plus-thick" size={28} color="white" />
            </TouchableOpacity>
          </View>

          {/* Activity Cards */}
          {sessions.map((session, index) => (
            <SessionCard
              key={index}
              title={session.name}
              image={getImageForTrainingType(session.training_type.name)}
              onPress={() =>
                router.push({
                  pathname: '/session/[sessionId]',
                  params: { sessionId: session.id },
                })
              } />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#141516',
    paddingTop: 40, // Adjust based on status bar height if needed
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  timeText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  iconText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 10,
  },
  // Welcome Section
  welcomeSection: {
    marginBottom: 20,
    position: 'relative',
    paddingHorizontal: 5,
  },
  welcomeText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  dateText: {
    color: 'gray',
    fontSize: 14,
    marginTop: 2,
  },
  menuIcon: {
    position: 'absolute',
    top: 5,
    right: 5,
  },
  // Current Status Card
  statusCard: {
    borderRadius: 15,
    padding: 20,
    marginBottom: 30,
  },
  cardTitle: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
    fontWeight: '600',
  },
  // Graph Placeholder Styles
  graphContainer: {
    paddingVertical: 10,
    marginBottom: 10,
  },
  graphArea: {
    height: 100, // Fixed height for the graph area
    justifyContent: 'center',
    alignItems: 'center',
  },
  curve: {
    // Simple line approximation for the graph
    width: '100%',
    height: 2,
    backgroundColor: 'red',
    position: 'absolute',
    top: 50, // Center vertically
    borderRadius: 1,
    opacity: 0.7,
  },
  graphLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  dayLabel: {
    color: 'gray',
    fontSize: 12,
  },
  // Status Metrics
  statusMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 10,
  },
  metricValue: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  metricLabel: {
    color: 'gray',
    fontSize: 12,
    marginTop: 4,
  },
  // Activity Section
  activitySection: {
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  activityTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Montserrat_400Regular',
  },
  activitySubtitle: {
    color: 'gray',
    fontSize: 14,
    marginBottom: 15,
    marginTop: 5,
  },
  // Activity Card
  activityCard: {
    width: '100%',
    aspectRatio: 2, // Approximate aspect ratio of the image
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 15,
    backgroundColor: '#333',
  },
  activityImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 15,
  },
  activityTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  activityText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Star Rating
  starContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 18,
    marginRight: 2,
  },
  addButton: {
    height: 50,
    width: 50,
    borderRadius: 100, // makes it round
    backgroundColor: '#F34E3A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  }
});
