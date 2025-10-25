// components/ui/Input.tsx
import { Image, ImageSourcePropType, StyleSheet, TextInput, View } from 'react-native';

type InputProps = {
  icon: ImageSourcePropType;
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
};

export default function Input({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
}: InputProps) {
  return (
    <View style={styles.inputContainer}>
      <Image source={icon} style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#080808',
    borderRadius: 100,
    paddingHorizontal: 15,
    marginVertical: 10,
    height: 60,
  },
  inputIcon: {
    width: 20,
    height: 20,
    marginLeft: 10,
    marginRight: 20,
    tintColor: '#555555',
  },
  input: {
    flex: 1,
    color: '#555555',
    fontSize: 16,
  },
});
