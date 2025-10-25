import { supabase } from '@/lib/supabase';
import { AntDesign } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
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
    onSubmit: (id: string, name: string, description: string) => void;
}

export function NewExerciseModal({ visible, onClose, onSubmit }: NewExerciseModalProps) {
    const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchExercises();
    }, []);

    async function fetchExercises() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('exercises')
                .select('*');

            if (error) throw error;

            setExercises(data || []);
        } catch (error) {
            setError(error instanceof Error ? error.message : 'No se pudieron obtener los ejercicios. Por favor, intenta nuevamente');
        } finally {
            setLoading(false);
        }
    }

    const handleSubmit = () => {
        if (selectedExercise) {
            onSubmit(selectedExercise.id, selectedExercise.name, selectedExercise.description);
            setSelectedExercise(null);
            setSearchQuery('');
            onClose();
        }
    };

    const filteredExercises = exercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
    );


    if (loading) {
        return (
            <Modal visible={visible} transparent>
                <View style={styles.centeredView}>
                    <View style={styles.modalView}>
                        <ActivityIndicator size="large" color="#F34E3A" />
                    </View>
                </View>
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal visible={visible} transparent>
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
        <Modal
            animationType="slide"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.centeredView}>
                <View style={styles.modalView}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Seleccionar Ejercicio</Text>
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

                    <ScrollView style={styles.exerciseList}>
                        {filteredExercises.map((exercise) => (
                            <TouchableOpacity
                                key={exercise.id}
                                style={[
                                    styles.exerciseItem,
                                    selectedExercise?.id === exercise.id && styles.selectedExercise
                                ]}
                                onPress={() => {
                                    setSelectedExercise(exercise);
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

                    <TouchableOpacity
                        style={[
                            styles.submitButton,
                            !selectedExercise && styles.submitButtonDisabled
                        ]}
                        onPress={handleSubmit}
                        disabled={!selectedExercise}
                    >
                        <Text style={styles.submitButtonText}>
                            {selectedExercise ? 'Agregar' : 'Selecciona un ejercicio'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    input: {
        backgroundColor: '#333',
        borderRadius: 10,
        padding: 15,
        color: '#fff',
        marginBottom: 15,
    },
    descriptionInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#F34E3A',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    exerciseList: {
        maxHeight: 200,
        marginBottom: 15,
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
    searchInput: {
        backgroundColor: '#333',
        borderRadius: 10,
        padding: 15,
        color: '#fff',
        marginBottom: 15,
    },
    exerciseItem: {
        backgroundColor: '#333',
        padding: 16,
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
    submitButtonDisabled: {
        backgroundColor: '#666',
        opacity: 0.7,
    },
});