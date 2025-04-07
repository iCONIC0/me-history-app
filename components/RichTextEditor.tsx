import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Platform } from 'react-native';

interface RichTextEditorProps {
  value: string;
  onChange: (text: string) => void;
  placeholder?: string;
}

export const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Escribe tu historia aquí...',
}) => {
  const [text, setText] = useState(value || '');

  const handleTextChange = (newText: string) => {
    setText(newText);
    onChange(newText);
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.textInput}
        multiline
        value={text}
        onChangeText={handleTextChange}
        placeholder={placeholder}
        placeholderTextColor="#999"
        textAlignVertical="top"
        autoCapitalize="sentences"
        autoCorrect={true}
        blurOnSubmit={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    minHeight: 250,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  textInput: {
    flex: 1,
    minHeight: 200,
    padding: 16,
    fontSize: 16,
    color: '#202024',
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
    ...Platform.select({
      ios: {
        paddingTop: 16,
        paddingBottom: 16,
      },
      android: {
        textAlignVertical: 'top',
        paddingTop: 16,
        paddingBottom: 16,
      },
    }),
  },
});
