import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../styles/designSystem';

interface BackIconProps {
  size?: number;
  color?: string;
}

const BackIcon: React.FC<BackIconProps> = ({ 
  size = 24, 
  color = Colors.text.primary 
}) => {
  return (
    <Svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <Path d="m12 19-7-7 7-7"/>
      <Path d="M19 12H5"/>
    </Svg>
  );
};

export default BackIcon;
