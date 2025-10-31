import AnalogChronometer from '@/components/ui/AnalogChronometer';
import { supabase } from '@/lib/supabase';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { FlatList, GestureHandlerRootView } from 'react-native-gesture-handler';

interface Exercise {
  id: string;
  name: string;
  description: string | null;
  muscle_group: string | null;
  sets: number | null;
  reps: number | null;
  weight: number | null;
  rest_time: number | null;
  position: number;
}

const secondsToHMS = (seconds: number) => {
  const hrs = Math.floor(seconds / 3600) % 12;
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return { hrs, mins, secs };
};

export default function SessionId() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();

  // Timer state: counting UP from 0 to duration
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0); // seconds elapsed
  const [duration, setDuration] = useState<number>(354); // seconds total
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Drift-free timer refs
  const endTimeRef = useRef<number | null>(null); // timestamp (ms) when we should hit 'duration'
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Formatters
  const formatMMSS = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
      deactivateKeepAwake();
    };
  }, []);

  // Load session exercises
  useEffect(() => {
    const fetchExercises = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('session_exercises')
          .select(`
            id,
            sets,
            reps,
            weight,
            rest_time,
            position,
            exercises (
              id,
              name,
              description,
              muscle_group
            )
          `)
          .eq('session_id', sessionId)
          .order('position', { ascending: true });

        if (error) throw error;

        if (data) {
          const formattedExercises: Exercise[] = data.map((item: any) => ({
            id: item.exercises.id,
            name: item.exercises.name,
            description: item.exercises.description,
            muscle_group: item.exercises.muscle_group,
            sets: item.sets,
            reps: item.reps,
            weight: item.weight,
            rest_time: item.rest_time,
            position: item.position,
          }));
          setExercises(formattedExercises);
        }
      } catch (err) {
        console.error('Failed to fetch exercises:', err);
      } finally {
        setLoading(false);
      }
    };

    if (sessionId) {
      fetchExercises();
    }
  }, [sessionId]);

  // Start playback with drift-free loop
  const start = async () => {
    if (isPlaying) return;
    if (currentTime >= duration) return;

    setIsPlaying(true);
    // compute endTime from remaining seconds
    const remainingMs = Math.max(0, (duration - currentTime) * 1000);
    endTimeRef.current = Date.now() + remainingMs;

    try {
      await activateKeepAwakeAsync();
    } catch { }

    // update 4x/sec for smooth thumb without overloading
    tickRef.current = setInterval(() => {
      const remaining = Math.max(0, (endTimeRef.current ?? Date.now()) - Date.now());
      const elapsed = duration * 1000 - remaining;
      const nextSeconds = Math.min(duration, Math.floor(elapsed / 1000));
      setCurrentTime(nextSeconds);

      if (nextSeconds >= duration) {
        // complete
        if (tickRef.current) {
          clearInterval(tickRef.current);
          tickRef.current = null;
        }
        endTimeRef.current = null;
        setIsPlaying(false);
        deactivateKeepAwake();
      }
    }, 250); // adjust if you want snappier UI
  };

  // Pause playback, keep currentTime frozen
  const pause = () => {
    if (!isPlaying) return;
    setIsPlaying(false);
    endTimeRef.current = null;
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    deactivateKeepAwake();
  };

  // Toggle play/pause
  const handlePlayPause = () => {
    if (isPlaying) pause();
    else start();
  };

  // Seek helpers (±10s)
  const seek = (delta: number) => {
    const next = Math.min(duration, Math.max(0, currentTime + delta));
    setCurrentTime(next);
    // If currently playing, recompute endTime to maintain accuracy
    if (isPlaying) {
      const remainingMs = Math.max(0, (duration - next) * 1000);
      endTimeRef.current = Date.now() + remainingMs;
    }
  };

  const handleRewind = () => seek(-10);
  const handleForward = () => seek(10);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const { hrs, mins, secs } = secondsToHMS(currentTime); // available if you want HH:MM:SS somewhere

  const renderExercise = ({ item }: { item: Exercise }) => (
    <View style={styles.exerciseItem}>
      <Text style={styles.exerciseTitle}>{item.name}</Text>
      <Text style={styles.exerciseDetails}>
        {item.sets} sets x {item.reps} reps {item.weight ? `@ ${item.weight}kg` : ''}
      </Text>
      {item.description ? (
        <Text style={styles.exerciseDescription}>{item.description}</Text>
      ) : null}
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Meditation Time</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          <AnalogChronometer
            size={300}
            durationSec={duration}
          />
        </View>

        {/* Bottom: Exercises list */}
        <View style={styles.exercisesContainer}>
          {loading ? (
            <Text style={{ color: '#fff', textAlign: 'center' }}>Loading exercises...</Text>
          ) : (
            <FlatList
              data={exercises}
              keyExtractor={(item) => item.id}
              renderItem={renderExercise}
            />
          )}
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141516',
    paddingTop: 75,
    display: 'flex',
    justifyContent: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
    marginTop: -4,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  timerText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '300',
    letterSpacing: 4,
    marginBottom: 16,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginBottom: 40,
  },
  timeLabel: {
    color: '#666',
    fontSize: 12,
    minWidth: 40,
  },
  progressBarContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#3a3a3a',
    borderRadius: 2,
    position: 'relative',
  },
  progressBarFill: {
    height: 4,
    backgroundColor: '#ff6b4a',
    borderRadius: 2,
  },
  progressThumb: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ff6b4a',
    top: -6,
    marginLeft: -8,
  },
  exercisesContainer: {
    marginBottom: 20,
  },
  exerciseItem: {
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 16,
    borderRadius: 8,
  },
  exerciseTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  exerciseDetails: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
  exerciseDescription: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 8,
  },
});
