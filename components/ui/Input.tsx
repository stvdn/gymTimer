import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

type InputProps = {
  name: ComponentProps<typeof FontAwesome6>['name'];
  size?: ComponentProps<typeof FontAwesome6>['size'];
  color?: ComponentProps<typeof FontAwesome6>['color'];
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
};

export default function Input({
  name,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  size = 18,
  color = '#555555',
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View
      style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused, // dynamic style
      ]}
    >
      <View style={{ width: 24, alignItems: 'center', marginLeft: 5 }}>
        <FontAwesome6 name={name} size={size} color={color} />
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
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
    borderWidth: 2,
    borderColor: 'transparent', // default border
  },
  inputContainerFocused: {
    borderColor: '#F34E3A', // border color when focused
  },
  input: {
    flex: 1,
    color: '#555555',
    fontSize: 16,
    marginLeft: 12,
  },
});
