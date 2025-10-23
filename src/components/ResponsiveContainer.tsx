import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useResponsiveLayout } from '../utils/responsiveLayout';
import { Colors } from '../styles/designSystem';

interface ResponsiveContainerProps {
  children: React.ReactNode;
  style?: any;
  contentStyle?: any;
}

/**
 * Responsive container that adapts to different screen sizes
 * Provides proper padding, max-width, and centering for tablets
 */
const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  style,
  contentStyle,
}) => {
  const layout = useResponsiveLayout();

  // Only apply responsive changes on tablets
  if (layout.isTablet) {
    return (
      <View style={[styles.container, style]}>
        <View
          style={[
            styles.content,
            {
              // Remove maxWidth and paddingHorizontal for full-bleed layout on tablets
              // maxWidth: layout.maxContentWidth,
              // paddingHorizontal: layout.containerPadding,
            },
            contentStyle,
          ]}
        >
          {children}
        </View>
      </View>
    );
  }

  // On phones, just return children without wrapper
  return <>{children}</>;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  content: {
    flex: 1,
    alignSelf: 'center',
    width: '100%',
  },
});

export default ResponsiveContainer;
