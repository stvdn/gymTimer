import { supabase } from '@/lib/supabase';
import { AntDesign } from '@expo/vector-icons';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

interface Exercise {
  id: string;
  name: string;
  description: string;
  muscle_group: string;
}

interface NewExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    exercise_id: string;
    name: string;
    description: string;
    sets: number;
    reps: number;
    weight: number;
  }) => void;
}

export function NewExerciseModal({ visible, onClose, onSubmit }: NewExerciseModalProps) {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Required fields (controlled)
  const [sets, setSets] = useState<string>('');
  const [reps, setReps] = useState<string>('');
  const [weight, setWeight] = useState<string>('');

  // Inline error messages
  const [setsErr, setSetsErr] = useState<string>('');
  const [repsErr, setRepsErr] = useState<string>('');
  const [weightErr, setWeightErr] = useState<string>('');
  const [exerciseErr, setExerciseErr] = useState<string>('');

  useEffect(() => {
    if (visible) fetchExercises();
  }, [visible]);

  async function fetchExercises() {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('exercises').select('*');
      if (error) throw error;
      setExercises(data || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudieron obtener los ejercicios. Por favor, intenta nuevamente'
      );
    } finally {
      setLoading(false);
    }
  }

  const filteredExercises = useMemo(
    () =>
      exercises.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      ),
    [exercises, searchQuery]
  );

  const clearForm = () => {
    setSelectedExercise(null);
    setSearchQuery('');
    setSets(''); setReps(''); setWeight('');
    setSetsErr(''); setRepsErr(''); setWeightErr(''); setExerciseErr('');
  };

  // Validation helpers
  const isPositiveInt = (v: string) => /^\d+$/.test(v) && Number(v) > 0;
  const isPositiveNumber = (v: string) => /^(\d+)(\.\d+)?$/.test(v) && Number(v) > 0;

  const validateAll = () => {
    let ok = true;
    // Exercise required
    if (!selectedExercise) {
      setExerciseErr('Selecciona un ejercicio');
      ok = false;
    } else {
      setExerciseErr('');
    }
    // Sets required positive integer
    if (!sets || !isPositiveInt(sets)) {
      setSetsErr('Sets requeridos (entero > 0)');
      ok = false;
    } else {
      setSetsErr('');
    }
    // Reps required positive integer
    if (!reps || !isPositiveInt(reps)) {
      setRepsErr('Reps requeridas (entero > 0)');
      ok = false;
    } else {
      setRepsErr('');
    }
    // Weight required positive number
    if (!weight || !isPositiveNumber(weight)) {
      setWeightErr('Peso requerido (número > 0)');
      ok = false;
    } else {
      setWeightErr('');
    }
    return ok;
  };

  const canSubmit = selectedExercise != null && isPositiveInt(sets) && isPositiveInt(reps) && isPositiveNumber(weight);

  const handleSubmit = () => {
    const ok = validateAll();
    if (!ok || !selectedExercise) return;

    onSubmit({
      exercise_id: selectedExercise.id,
      name: selectedExercise.name,
      description: selectedExercise.description,
      sets: Number(sets),
      reps: Number(reps),
      weight: Number(weight),
    });

    clearForm();
    onClose();
  };

  // Loading
  if (loading) {
    return (
      <Modal visible={visible} transparent onRequestClose={onClose}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <ActivityIndicator size="large" color="#F34E3A" />
          </View>
        </View>
      </Modal>
    );
  }

  // Error
  if (error) {
    return (
      <Modal visible={visible} transparent onRequestClose={onClose}>
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.errorText}>{error}</Text>
            <View style={styles.errorButtonsContainer}>
              <TouchableOpacity
                style={[styles.submitButton, styles.errorButton]}
                onPress={fetchExercises}
              >
                <Text style={styles.submitButtonText}>Reintentar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, styles.errorButton, styles.closeButton]}
                onPress={onClose}
              >
                <Text style={styles.submitButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.centeredView}
      >
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Selecciona un Ejercicio</Text>
            <TouchableOpacity onPress={onClose}>
              <AntDesign name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar ejercicio..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {!!exerciseErr && <Text style={styles.inlineError}>{exerciseErr}</Text>}

          <ScrollView style={styles.exerciseList} keyboardShouldPersistTaps="handled">
            {filteredExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={[
                  styles.exerciseItem,
                  selectedExercise?.id === exercise.id && styles.selectedExercise,
                ]}
                onPress={() => {
                  setSelectedExercise(exercise);
                  setExerciseErr('');
                }}
              >
                <View>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  <Text style={styles.exerciseGroup}>{exercise.muscle_group}</Text>
                </View>
                {selectedExercise?.id === exercise.id && (
                  <AntDesign name="check" size={20} color="#F34E3A" />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Required fields */}
<View style={styles.fieldsBlock}>
  {/* Sets */}
  <View style={styles.labelRow}>
    <Text style={styles.label}>Series*</Text>
    <TextInput
      style={styles.labeledInput}
      placeholder="e.g. 4"
      placeholderTextColor="#9aa0a6"
      keyboardType="number-pad"
      value={sets}
      onChangeText={(t) => { setSets(t); if (setsErr) setSetsErr(''); }}
      returnKeyType="done"
    />
  </View>
  {!!setsErr && <Text style={styles.inlineError}>{setsErr}</Text>}

  {/* Reps */}
  <View style={styles.labelRow}>
    <Text style={styles.label}>Repes*</Text>
    <TextInput
      style={styles.labeledInput}
      placeholder="e.g. 12"
      placeholderTextColor="#9aa0a6"
      keyboardType="number-pad"
      value={reps}
      onChangeText={(t) => { setReps(t); if (repsErr) setRepsErr(''); }}
      returnKeyType="done"
    />
  </View>
  {!!repsErr && <Text style={styles.inlineError}>{repsErr}</Text>}

  {/* Peso */}
  <View style={styles.labelRow}>
    <Text style={styles.label}>Peso (kg)*</Text>
    <TextInput
      style={styles.labeledInput}
      placeholder="e.g. 30.5"
      placeholderTextColor="#9aa0a6"
      keyboardType="decimal-pad"
      value={weight}
      onChangeText={(t) => { setWeight(t); if (weightErr) setWeightErr(''); }}
      returnKeyType="done"
    />
  </View>
  {!!weightErr && <Text style={styles.inlineError}>{weightErr}</Text>}
</View>

          <TouchableOpacity
            style={[styles.submitButton]}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              Agregar
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}


const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '90%',
    backgroundColor: '#242424',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchInput: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginBottom: 12,
  },
  exerciseList: {
    maxHeight: 200,
    marginBottom: 12,
  },
  exerciseItem: {
    backgroundColor: '#333',
    padding: 14,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedExercise: {
    backgroundColor: '#444',
    borderColor: '#F34E3A',
    borderWidth: 1,
  },
  exerciseName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseGroup: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 12,
    color: '#fff',
    marginBottom: 10,
    fontSize: 18,      // bigger text
    lineHeight: 22,    // aligns with new height
  },
  row: {
    rowGap: 4,
    marginVertical: 10,
    height: 150,
  },
  submitButton: {
    backgroundColor: '#F34E3A',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: '#F34E3A',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  errorButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  errorButton: {
    flex: 1,
  },
  closeButton: {
    backgroundColor: '#666',
  },
  inlineError: { color: '#FF6B6B', fontSize: 12, marginBottom: 6 },
  fieldsBlock: {
  width: '100%',
  marginTop: 8,
  marginBottom: 8,
},
labelRow: {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  columnGap: 12,
  backgroundColor: '#2b2b2b',
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  marginBottom: 6,
},
label: {
  color: '#e6e6e6',
  fontSize: 16,
  fontWeight: '600',
  minWidth: 92, // ensures labels align vertically
},
labeledInput: {
  flex: 1,
  backgroundColor: '#333',
  borderRadius: 8,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: '#fff',
  fontSize: 18,
  lineHeight: 22,
},
});
