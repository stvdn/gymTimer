import StopWatcher from '@/components/ui/StopWatcher';
import { supabase } from '@/lib/supabase';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { FlatList, GestureHandlerRootView } from 'react-native-gesture-handler';

// Optional: for background notifications
import * as Notifications from 'expo-notifications';

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

type ExerciseProgress = {
  exerciseId: string;
  currentSet: number;
  totalSets: number;
};

export default function SessionId() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const [duration, setDuration] = useState<number>(0);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const FALLBACK_REST = 120;

  // Track which exercise and set we're on
  const [activeExerciseIdx, setActiveExerciseIdx] = useState<number>(0);
  const [progress, setProgress] = useState<Record<string, ExerciseProgress>>({});

  // Key to force StopWatcher remount when duration changes
  const [watcherKey, setWatcherKey] = useState<number>(0);

  const notifIdRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!sessionId) return;
      setLoading(true);
      try {
        const { data: sessionRow, error: sessionErr } = await supabase
          .from('sessions')
          .select('id, training_type_id')
          .eq('id', sessionId)
          .single();

        if (sessionErr) throw sessionErr;
        const trainingTypeId = sessionRow?.training_type_id ?? null;

        const { data, error } = await supabase
          .from('session_exercises')
          .select(`
            id,
            sets,
            reps,
            weight,
            position,
            exercises:exercises (
              id,
              name,
              description,
              muscle_group
            )
          `)
          .eq('session_id', sessionId)
          .order('position', { ascending: true });

        if (error) throw error;

        let restMap: Record<string, number> = {};
        if (trainingTypeId && data && data.length > 0) {
          const exerciseIds = data.map((d: any) => d.exercises.id);
          const { data: restRows, error: restErr } = await supabase
            .from('exercise_training_rest')
            .select('exercise_id, training_type_id, rest_time')
            .eq('training_type_id', trainingTypeId)
            .in('exercise_id', exerciseIds);

          if (restErr) throw restErr;

          restMap = (restRows ?? []).reduce((acc: Record<string, number>, r: any) => {
            acc[r.exercise_id] = r.rest_time;
            return acc;
          }, {});
        }

        const formattedExercises: Exercise[] = (data ?? []).map((item: any) => ({
          id: item.exercises.id,
          name: item.exercises.name,
          description: item.exercises.description,
          muscle_group: item.exercises.muscle_group,
          sets: item.sets,
          reps: item.reps,
          weight: item.weight,
          rest_time: restMap[item.exercises.id] ?? null,
          position: item.position,
        }));

        setExercises(formattedExercises);

        // Initialize progress
        const initProgress: Record<string, ExerciseProgress> = {};
        for (const e of formattedExercises) {
          const totalSets = typeof e.sets === 'number' && e.sets > 0 ? e.sets : 0;
          initProgress[e.id] = { exerciseId: e.id, currentSet: 0, totalSets };
        }
        setProgress(initProgress);

        // Set initial duration
        const firstWithRest = formattedExercises.find(e => typeof e.rest_time === 'number' && e.rest_time! > 0);
        setDuration(firstWithRest?.rest_time ?? FALLBACK_REST);
        setActiveExerciseIdx(0);
      } catch (err) {
        console.error('Failed to fetch session/exercises/rest:', err);
        setDuration(FALLBACK_REST);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [sessionId]);

  const currentExercise = useMemo(() => {
    if (exercises.length === 0) return null;
    return exercises[Math.min(activeExerciseIdx, exercises.length - 1)] ?? null;
  }, [exercises, activeExerciseIdx]);

  const currentRestSec = useMemo(() => {
    if (!currentExercise) return FALLBACK_REST;
    return typeof currentExercise.rest_time === 'number' && currentExercise.rest_time > 0
      ? currentExercise.rest_time
      : FALLBACK_REST;
  }, [currentExercise, FALLBACK_REST]);

  // Optional: schedule notification
  const scheduleEndOfRestNotification = async (secondsFromNow: number) => {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Descanso terminado",
          body: currentExercise ? `Siguiente set: ${currentExercise.name}` : 'Siguiente set',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: Math.max(1, Math.floor(secondsFromNow)),
        },
      });
      notifIdRef.current = id;
    } catch (e) {
      console.warn('Failed to schedule notification', e);
    }
  };

  const cancelScheduledNotification = async () => {
    try {
      if (notifIdRef.current) {
        await Notifications.cancelScheduledNotificationAsync(notifIdRef.current);
      }
      notifIdRef.current = null;
    } catch (e) {
      // ignore
    }
  };

  // onComplete handler: advance set or move to next exercise
  const handleRestComplete = async () => {
    const ex = currentExercise;
    if (!ex) return;

    // Advance current set
    setProgress(prev => {
      const cur = prev[ex.id] ?? { exerciseId: ex.id, currentSet: 0, totalSets: ex.sets ?? 0 };
      const nextSet = Math.min(cur.currentSet + 1, cur.totalSets);
      return { ...prev, [ex.id]: { ...cur, currentSet: nextSet } };
    });

    const curProg = progress[ex.id] ?? { exerciseId: ex.id, currentSet: 0, totalSets: ex.sets ?? 0 };
    const willBeSet = Math.min(curProg.currentSet + 1, curProg.totalSets);
    if (willBeSet < curProg.totalSets) {
      // More sets for this exercise
      const nextRest = currentRestSec;
      setDuration(nextRest);
      setWatcherKey(prev => prev + 1); // force remount
      await cancelScheduledNotification();
      scheduleEndOfRestNotification(nextRest);
      return;
    }

    // Move to next exercise
    const nextExerciseIdx = activeExerciseIdx + 1;
    if (nextExerciseIdx < exercises.length) {
      setActiveExerciseIdx(nextExerciseIdx);
      const nextExercise = exercises[nextExerciseIdx];
      const nextRest = typeof nextExercise.rest_time === 'number' && nextExercise.rest_time > 0
        ? nextExercise.rest_time
        : FALLBACK_REST;
      setDuration(nextRest);
      setWatcherKey(prev => prev + 1); // force remount 
      await cancelScheduledNotification();
      scheduleEndOfRestNotification(nextRest);
    } else {
      // Workout complete
      setActiveExerciseIdx(-1);
      setDuration(0);
      setWatcherKey(prev => prev + 1); // force remount 
      await cancelScheduledNotification();
      router.replace('/Home');
    }
  };

  const renderExercise = ({ item }: { item: Exercise }) => {
    const isActive = item.id === currentExercise?.id;

    return (isActive ? (
      <>
       <View style={[styles.exerciseItem, isActive && styles.activeExerciseItem]}>
        <Text style={styles.currentExerciseName}>{currentExercise.name}</Text>
        <Text style={styles.setInfo}>
          Set {(progress[currentExercise.id].currentSet) + 1} de {progress[currentExercise.id].totalSets}
        </Text>
        <Text style={styles.motivationalText}>
        {currentExercise.position === exercises.length - 1
          ? '¡Último ejercicio! ¡Da lo mejor de ti!'
          : 'Toma aire, tu próximo reto te espera 👇'}  
        </Text>
      </View>
      </>
    ) : (
      <>
        <View style={[styles.exerciseItem, isActive && styles.activeExerciseItem]}>
          <Text style={styles.exerciseTitle}>{item.name}</Text>
          <Text style={styles.exerciseDetails}>
          {item.sets} sets de {item.reps ?? 0} repeticiones{item.weight ? `, peso de ${item.weight}kg` : ''}
          </Text>
        </View>
      </>
    )
    );
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Descanso</Text>
          <View style={styles.placeholder} />
        </View>


        <View style={{ alignItems: 'center', marginBottom: 24 }}>
          {/* Key prop forces complete remount when duration changes [web:66][web:70][web:72] */}
          <StopWatcher
            key={watcherKey}
            size={300}
            durationSec={duration}
            onComplete={handleRestComplete}
          />
        </View>

        {/* Bottom: Exercises list */}
        <View style={styles.exercisesContainer}>
          {loading ? (
            <Text style={{ color: '#fff', textAlign: 'center' }}>Cargando ejericios...</Text>
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
    fontSize: 22,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
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
    fontSize: 20,
    fontWeight: '700',
  },
  exerciseDetails: {
    color: '#ccc',
    fontSize: 14,
    marginTop: 4,
  },
  exerciseProgress: {
    color: '#ccc',
    fontSize: 16,
    marginTop: 4,
  },
  activeExerciseItem: {
    borderWidth: 2,
    borderColor: '#ff6b4a',
  },
  restStatusCard: {
    backgroundColor: '#2a2a2a',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    borderLeftWidth: 4,
    borderLeftColor: '#4a9eff', // Calming blue for rest
  },
  restBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a5f',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  restBadgeIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  restBadgeText: {
    color: '#4a9eff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  currentExerciseName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
  },
  setInfo: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 4,
    fontWeight: '600',
  },
  motivationalText: {
    color: '#888',
    fontSize: 13,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
