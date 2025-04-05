import { View, type ViewProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useStyles } from '@/hooks/useStyles';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  variant?: 'container' | 'card' | 'collapsible';
};

export function ThemedView({ 
  style, 
  lightColor, 
  darkColor, 
  variant = 'container',
  ...otherProps 
}: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');
  const styles = useStyles();

  return (
    <View 
      style={[
        { backgroundColor },
        styles.view[variant],
        style
      ]} 
      {...otherProps} 
    />
  );
}
