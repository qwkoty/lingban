import React from 'react';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export const BotIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="6" width="18" height="14" rx="3" stroke={color} strokeWidth="2" />
    <Circle cx="9" cy="12" r="1.5" fill={color} />
    <Circle cx="15" cy="12" r="1.5" fill={color} />
    <Path d="M8 17c1.333 1 4.667 1 6 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    <Path d="M12 3v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M8 3v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M16 3v3" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const AddIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const SendIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 2L11 13" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M22 2l-6 20-5-9-9-5 20-6z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const BackIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const UserIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2" />
    <Path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const EditIcon = ({ size = 20, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 20h9" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4L16.5 3.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const TrashIcon = ({ size = 20, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6h18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6" stroke={color} strokeWidth="2" />
    <Path d="M10 11v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
    <Path d="M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const ChevronRightIcon = ({ size = 20, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ChatIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l2.7-5.7A8.38 8.38 0 014.5 11.5a8.5 8.5 0 0117 0z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ThemeIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" />
    <Path d="M12 3v18" stroke={color} strokeWidth="2" />
    <Path d="M3 12h18" stroke={color} strokeWidth="2" />
    <Circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2" />
  </Svg>
);

export const ShieldIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const ServerIcon = ({ size = 24, color = '#000' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="7" rx="2" stroke={color} strokeWidth="2" />
    <Rect x="3" y="14" width="18" height="7" rx="2" stroke={color} strokeWidth="2" />
    <Circle cx="7" cy="6.5" r="1" fill={color} />
    <Circle cx="7" cy="17.5" r="1" fill={color} />
  </Svg>
);
