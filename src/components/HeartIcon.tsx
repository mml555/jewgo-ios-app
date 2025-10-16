import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface HeartIconProps {
  /** Size of the heart icon */
  size?: number;
  /** Color of the heart fill */
  color?: string;
  /** Whether the heart is filled */
  filled?: boolean;
  /** Whether to show white border */
  showBorder?: boolean;
  /** Border color (defaults to white) */
  borderColor?: string;
  /** Border width */
  strokeWidth?: number;
  /** Test ID */
  testID?: string;
}

/**
 * Custom SVG HeartIcon component with built-in white stroke
 * Creates a perfect heart shape with customizable fill and stroke
 */
export const HeartIcon: React.FC<HeartIconProps> = ({
  size = 28,
  color = '#b8b8b8',
  filled = true,
  showBorder = true,
  borderColor = '#FFFFFF',
  strokeWidth = 2,
  testID,
}) => {
  // SVG heart path (standard heart shape)
  const heartPath =
    'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z';

  return (
    <View style={styles.container} testID={testID}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          d={heartPath}
          fill={color}
          stroke={showBorder ? borderColor : 'none'}
          strokeWidth={showBorder ? strokeWidth : 0}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HeartIcon;
