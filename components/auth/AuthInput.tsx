import React from 'react';
import { View, TextInput, TextInputProps, Text } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useStyles } from '@/hooks/useStyles';

interface AuthInputProps extends TextInputProps {
  label: string;
  error?: string;
}

export const AuthInput: React.FC<AuthInputProps> = ({ label, error, ...props }) => {
  const { colors } = useTheme();
  const styles = useStyles();
  const errorColor = '#ff3b30'; // Color de error para inputs

  return (
    <View style={styles.view.authInputContainer}>
      <Text style={styles.text.label}>{label}</Text>
      <TextInput
        style={[
          styles.input.default,
          {
            borderColor: error ? errorColor : colors.border,
          },
        ]}
        placeholderTextColor={colors.text}
        {...props}
      />
      {error && <Text style={styles.text.error}>{error}</Text>}
    </View>
  );
}; 