import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';

type ButtonProps = {
  title: string;
  onPress: () => void;
  backgroundColorProp?: string;
  textColor?: string;
  disabled?: boolean;
  buttonStyle?: ViewStyle;
  loading?: boolean;        // <-- add this
};

export default function Button({
  title,
  onPress,
  backgroundColorProp = '#140702',
  textColor = '#F34E3A',
  disabled = false,
  buttonStyle = {},
  loading = false,          // <-- default
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: backgroundColorProp },
        buttonStyle,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});