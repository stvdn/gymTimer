import { useState } from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const COLORS = {
    background: '#121212',
    card: '#242424',
    textPrimary: '#FFFFFF',
    textSecondary: '#A9A9A9',
    primaryRed: '#FF4136',
    uncheckedCircle: '#444444',
    checkedRed: '#FF4136',
} as const;

interface NewSessionModalProps {
    visible: boolean;
    onClose: () => void;
    onsubmit: (sesssionName: string) => void;
}

export default function NewSessionModal({ visible, onClose, onsubmit }: NewSessionModalProps) {
    const [sessionName, setSessionName] = useState('');

    const handleSubmit = () => {
        onsubmit(sessionName);
        setSessionName('');
        onClose();
    }

    return (
        <Modal
            visible={visible}
            transparent
        >
            <View style={styles.modalOverlay}>
                <View style={styles.saveModalContainer}>
                    <Text style={styles.saveModalTitle}>Nombre de la sesión</Text>
                    <TextInput
                        style={styles.saveModalInput}
                        placeholder="Ej: Día de pierna"
                        placeholderTextColor={COLORS.textSecondary}
                        value={sessionName}
                        onChangeText={setSessionName}
                        autoFocus
                    />
                    <View style={styles.saveModalButtons}>
                        <TouchableOpacity
                            style={[styles.saveModalButton, styles.confirmButton]}
                            onPress={handleSubmit}
                        >
                            <Text style={styles.confirmButtonText}>Guardar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.saveModalButton, styles.cancelButton]}
                            onPress={onClose}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveModalContainer: {
        width: '85%',
        backgroundColor: COLORS.card,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
    },
    saveModalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 20,
    },
    saveModalInput: {
        width: '100%',
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 20,
    },
    saveModalButtons: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    saveModalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.uncheckedCircle,
    },
    confirmButton: {
        backgroundColor: COLORS.primaryRed,
    },
    cancelButtonText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    },
    confirmButtonText: {
        color: COLORS.textPrimary,
        fontSize: 16,
        fontWeight: '600',
    }
})