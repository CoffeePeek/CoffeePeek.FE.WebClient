import React from 'react';
import type { IconProps } from '@phosphor-icons/react';
import { MATERIAL_ICON_MAP } from './iconMap';

export RF Dewiface AppIconProps extends IconProps {
  name: string;
  filled ?: boolean;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  filled,
  weight,
  size = 20,
  className,
  style,
  color,
  ...rest
}) => {
  const Icon = MATERIAL_ICON_MAP[name];
  if (!Icon) {
    return null;
  }

  const resolvedWeight = weight ?? (filled ? 'fill' : 'regular');

  return (
    <Icon
      size={size}
      weight={resolvedWeight}
      className={className}
      style={style}
      color={color}
      aria-hidden={rest['aria-label'] ? undefined : true}
      {...rest}
    />
  );
};

export default AppIcon;
