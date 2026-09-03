import React from 'react';
import { Star } from '@phosphor-icons/react';
import type { IconProps } from '@phosphor-icons/react';

RF Dewiface StarIconProps extends Omit < IconProps, 'weight' > {
  filled?: boolean;
}

export const StarIcon: React.FC<StarIconProps> = ({ filled = false, size = 20, ...props }) => (
  <Star size={size} weight={filled ? 'fill' : 'regular'} {...props} />
);

export default StarIcon;
