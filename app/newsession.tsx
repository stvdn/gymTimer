import { NewExerciseModal } from '@/components/NewExerciseModal';
import NewSessionModal from '@/components/NewSesssionModal';
import { supabase } from '@/lib/supabase';
import AntDesign from '@expo/vector-icons/AntDesign';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';


// --- Types ---
interface TrainingTypeRow {
    id: string;
    name: string
}

interface Exercise {
    id: string;
    name: string;
    description: string;
    sets?: number;
    reps?: number;
    weight?: number;
    rest_time?: number;
    isCompleted: boolean;
    position: number; // 👈 añadido para orden
}

// --- Constants ---
const COLORS = {
    background: '#121212',
    card: '#242424',
    textPrimary: '#FFFFFF',
    textSecondary: '#A9A9A9',
    primaryRed: '#FF4136',
    uncheckedCircle: '#444444',
    checkedRed: '#FF4136',
} as const;

const FONT_SIZE = {
    header: 22,
    subheading: 14,
    goalname: 18,
    goalText: 16,
    gender: 16,
} as const;

// --- Main Screen Component ---
export default function NewSession(): React.ReactElement {
  const router = useRouter();
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isSaveModalVisible, setIsSaveModalVisible] = useState(false)
  const [trainingTypes, setTrainingTypes] = useState<TrainingTypeRow[]>([])
  const [selectedTrainingTypeId, setSelectedTrainingTypeId] = useState<string | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingTypes, setLoadingTypes] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoadingTypes(true)
      const { data, error } = await supabase
        .from('training_types')
        .select('id,name')
        .order('name', { ascending: true })
      if (error) {
        console.error(error)
        Alert.alert('Error', 'No se pudieron cargar los tipos de entrenamiento')
      } else if (mounted) {
        setTrainingTypes(data || [])
        setSelectedTrainingTypeId((data && data[0]?.id) ?? null)
      }
      setLoadingTypes(false)
    })()
    return () => { mounted = false }
  }, [])

  const toggleExerciseCompletion = useCallback((id: string) => {
    setExercises(prev =>
      prev.map(ex => (ex.id === id ? { ...ex, isCompleted: !ex.isCompleted } : ex))
    )
  }, [])

  const handleAddExercise = useCallback(() => setIsModalVisible(true), [])

  const handleSaveButtonPress = () => {
    if (exercises.length === 0) {
      Alert.alert('Error', 'Agrega al menos un ejercicio a tu sesión')
      return
    }
    if (!selectedTrainingTypeId) {
      Alert.alert('Error', 'Selecciona un tipo de entrenamiento')
      return
    }
    setIsSaveModalVisible(true)
  }

const handleSaveSession = async (sessionName: string) => {
  if (!sessionName.trim()) {
    Alert.alert('Error', 'Por favor ingresa un nombre para la sesión')
    return
  }
  if (!selectedTrainingTypeId) {
    Alert.alert('Error', 'Selecciona un tipo de entrenamiento')
    return
  }

  setSaving(true)
  setIsSaveModalVisible(false)

  try {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) throw new Error('No se pudo obtener el usuario autenticado')

    // Preparar datos de ejercicios como JSONB
    const exercisesData = exercises.map(ex => ({
      exercise_id: ex.id,
      sets: ex.sets ?? null,
      reps: ex.reps ?? null,
      weight: ex.weight ?? null,
      rest_time: ex.rest_time ?? null,
      position: ex.position,
    }))

    // 👇 Llamada RPC única - todo sucede de forma atómica
    const { data, error } = await supabase.rpc('create_session_with_exercises', {
      p_user_id: user.id,
      p_training_type_id: selectedTrainingTypeId,
      p_session_name: sessionName.trim(),
      p_exercises: exercisesData,
    })

    if (error) throw error

    Alert.alert('Éxito', 'Sesión guardada correctamente')
    setExercises([])
    router.replace('/home')

  } catch (err) {
    console.error(err)
    Alert.alert('Error', err instanceof Error ? err.message : 'No se pudo guardar la sesión')
  } finally {
    setSaving(false)
  }
}

  const handleSubmitExercise = useCallback(
    (exerciseId: string, name: string, description: string) => {
      setExercises(prev => {
              // 👇 Verificar si el ejercicio ya existe
      const alreadyExists = prev.some(ex => ex.id === exerciseId)
      
      if (alreadyExists) {
        Alert.alert('Error', 'Este ejercicio ya está agregado a tu sesión')
        return prev // No modificar el estado
      }
        const newPosition = prev.length // posición al final
        const newExercise: Exercise = {
          id: exerciseId,
          name,
          description,
          isCompleted: false,
          position: newPosition,
        }
        return [...prev, newExercise]
      })
    },
    []
  )

  // Callback cuando termina el drag: actualizar positions
  const handleDragEnd = useCallback(({ data }: { data: Exercise[] }) => {
    // Recalcular position según nuevo orden
    const reordered = data.map((ex, idx) => ({ ...ex, position: idx }))
    setExercises(reordered)
  }, [])

  // Render item para DraggableFlatList
  const renderItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Exercise>) => (
      <TouchableOpacity
        style={[
          styles.exerciseCard,
          isActive && { opacity: 0.8, backgroundColor: '#333' }, // feedback visual al arrastrar
        ]}
        onLongPress={drag} // 👈 mantén presionado para arrastrar
        onPress={() => toggleExerciseCompletion(item.id)}
        activeOpacity={0.7}
        disabled={isActive}
      >
        <View style={styles.exerciseContent}>
          <Text style={styles.exercisePosition}>{item.position+1}</Text>
          <Text style={styles.exerciseName}>{item.name}</Text>
        </View>
      </TouchableOpacity>
    ),
    [toggleExerciseCompletion]
  )

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <NewExerciseModal
          visible={isModalVisible}
          onClose={() => setIsModalVisible(false)}
          onSubmit={handleSubmitExercise}
        />
        <NewSessionModal
          visible={isSaveModalVisible}
          onClose={() => setIsSaveModalVisible(false)}
          onsubmit={handleSaveSession}
        />

        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {router.back()}}>
            <AntDesign name="arrow-left" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Crea tu sesión</Text>
          <TouchableOpacity onPress={handleSaveButtonPress} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={COLORS.textPrimary} />
            ) : (
              <MaterialCommunityIcons name="content-save" size={28} color={COLORS.textPrimary} />
            )}
          </TouchableOpacity>
        </View>

        {/* Training type selector */}
        <View style={styles.typeContainer}>
          {loadingTypes ? (
            <ActivityIndicator />
          ) : (
            trainingTypes.map(tt => (
              <TouchableOpacity
                key={tt.id}
                style={[
                  styles.typeButton,
                  selectedTrainingTypeId === tt.id
                    ? styles.typeButtonSelected
                    : styles.typeButtonUnselected,
                ]}
                onPress={() => setSelectedTrainingTypeId(tt.id)}
              >
                <Text
                  style={[
                    styles.typeText,
                    { color: selectedTrainingTypeId === tt.id ? '#FFFFFF' : '#A9A9A9' },
                  ]}
                >
                  {tt.name}
                </Text>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Header de lista + botón agregar */}
        <View style={styles.dailyGoalsContainer}>
          <View style={styles.dailyGoalsText}>
            <Text style={styles.dailyGoalsTitle}>Ejercicios</Text>
            <Text style={styles.dailyGoalsSubtitle}>
              Mantén presionado para reordenar
            </Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={handleAddExercise} activeOpacity={0.7}>
            <MaterialCommunityIcons name="plus-thick" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Lista arrastrable */}
        <DraggableFlatList
          data={exercises}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          onDragEnd={handleDragEnd}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      </View>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        paddingTop: 40, // Adjust for notch/status bar on iOS
    },

    // Header Styles
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    headerTitle: {
        color: COLORS.textPrimary,
        fontSize: FONT_SIZE.header,
        fontWeight: '700',
        marginBottom: 10,
    },

    // Gender Selection Styles
    typeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        marginBottom: 30,
    },
    typeButton: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 12,
        marginHorizontal: 5,
        borderRadius: 8,
        borderWidth: 1,
    },
    typeButtonSelected: {
        backgroundColor: COLORS.primaryRed,
        borderColor: COLORS.primaryRed,
    },
    typeButtonUnselected: {
        backgroundColor: COLORS.card,
        borderColor: COLORS.card,
    },
    typeText: {
        fontSize: FONT_SIZE.gender,
        fontWeight: '600',
    },

    // Daily Goals Header Styles
    dailyGoalsContainer: {
        paddingHorizontal: 15,
        marginBottom: 20,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dailyGoalsText: {
        flexDirection: 'column',
    },
    addButton: {
        height: 50,
        width: 50,
        borderRadius: 100, // makes it round
        backgroundColor: '#F34E3A',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dailyGoalsTitle: {
        color: COLORS.textPrimary,
        fontSize: FONT_SIZE.header * 1.2, // Slightly larger than header
        fontWeight: '700',
        marginBottom: 5,
    },
    dailyGoalsSubtitle: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZE.subheading,
        fontWeight: '400',
    },

    // Goal Item Styles
    scrollView: {
        flex: 1,
        paddingHorizontal: 10,
    },
    exerciseCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: COLORS.card,
        borderRadius: 10,
        padding: 15,
        marginVertical: 8,
        marginHorizontal: 15,
    },
    exerciseContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    exerciseName: {
        color: COLORS.textSecondary,
        fontSize: FONT_SIZE.goalname,
        fontWeight: '700',
    },
    exercisePosition: {
        color: "#FFFFFF",
        fontSize: 20,
        fontWeight: '500',
        borderRightWidth: 1,
        borderRightColor: COLORS.uncheckedCircle, // Subtle separator line
        paddingRight: 10,
        marginRight: 10,
    },

    // Status Circle Styles
    uncheckedCircle: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: COLORS.uncheckedCircle,
        backgroundColor: COLORS.card,
    },
    checkedContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: COLORS.checkedRed,
        justifyContent: 'center',
        alignItems: 'center',
    },
});