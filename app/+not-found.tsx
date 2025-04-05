import React from 'react';
import { Link, Stack } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useStyles } from '@/hooks/useStyles';

export default function NotFoundScreen() {
  const styles = useStyles();
  
  return (
    <>
      <Stack.Screen options={{ title: 'Oops!' }} />
      <ThemedView style={[styles.view.container, styles.layout.center, { padding: 20 }]}>
        <ThemedText type="title">This screen doesn't exist.</ThemedText>
        <Link href="/" style={{ marginTop: 15, paddingVertical: 15 }}>
          <ThemedText type="link">Go to home screen!</ThemedText>
        </Link>
      </ThemedView>
    </>
  );
}
