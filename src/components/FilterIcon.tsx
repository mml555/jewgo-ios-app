import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface FilterIconProps {
  size?: number;
  color?: string;
}

const FilterIcon: React.FC<FilterIconProps> = ({ size = 16, color = '#666' }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <Path d="M10 5H3"/>
    <Path d="M12 19H3"/>
    <Path d="M14 3v4"/>
    <Path d="M16 17v4"/>
    <Path d="M21 12h-9"/>
    <Path d="M21 19h-5"/>
    <Path d="M21 5h-7"/>
    <Path d="M8 10v4"/>
    <Path d="M8 12H3"/>
  </Svg>
);

export default FilterIcon;
