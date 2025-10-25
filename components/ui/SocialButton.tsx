import React from 'react';
import { Image, ImageSourcePropType, StyleProp, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';

type SocialButtonProps = {
  icon: ImageSourcePropType;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export default function SocialButton({ icon, onPress, style }: SocialButtonProps) {
  return (
    <TouchableOpacity style={[styles.socialButton, style]} onPress={onPress}>
      <Image source={icon} style={styles.socialIcon} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  socialButton: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    width: 50,
    height: 50,
  },
});