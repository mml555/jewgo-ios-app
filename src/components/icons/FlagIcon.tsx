import React from 'react';
import Svg, { Path } from 'react-native-svg';
import { Colors } from '../../styles/designSystem';

interface FlagIconProps {
  size?: number;
  color?: string;
}

const FlagIcon: React.FC<FlagIconProps> = ({ 
  size = 24, 
  color = Colors.status.error 
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
      <Path d="M4 22V4a1 1 0 0 1 .4-.8A6 6 0 0 1 8 2c3 0 5 2 7.333 2q2 0 3.067-.8A1 1 0 0 1 20 4v10a1 1 0 0 1-.4.8A6 6 0 0 1 16 16c-3 0-5-2-8-2a6 6 0 0 0-4 1.528"/>
    </Svg>
  );
};

export default FlagIcon;
