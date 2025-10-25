// components/ui/Button.tsx
import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

type ButtonProps = {
  title: string;
  onPress: () => void;
  backgroundColorProp?: string;
  textColor?: string;
  disabled?: boolean;
  buttonStyle?: ViewStyle;
};

export default function Button({
  title,
  onPress,
  backgroundColorProp = '#140702',
  textColor = '#F34E3A',
  disabled = false,
  buttonStyle = {}
}: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: backgroundColorProp },
        buttonStyle
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 15,
    paddingHorizontal: 110,
    borderRadius: 100,
    borderColor: '#F34E3A',
    borderWidth: 2,
    width: '100%',
  },
  text: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
  },
});
