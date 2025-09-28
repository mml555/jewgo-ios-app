import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';
import { Colors } from '../../styles/designSystem';

interface SearchIconProps {
  size?: number;
  color?: string;
}

const SearchIcon: React.FC<SearchIconProps> = ({ 
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
      <Circle cx="11" cy="11" r="8"/>
      <Path d="m21 21-4.35-4.35"/>
    </Svg>
  );
};

export default SearchIcon;
