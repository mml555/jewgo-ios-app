import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../../styles/designSystem';

interface EyeIconProps {
  size?: number;
  color?: string;
}

const EyeIcon: React.FC<EyeIconProps> = ({ 
  size = 24, 
  color = Colors.primary.main 
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
      <Path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
      <Circle cx="12" cy="12" r="3"/>
    </Svg>
  );
};

export default EyeIcon;
